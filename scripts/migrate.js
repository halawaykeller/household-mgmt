// Runs pending SQL migrations against POSTGRES_URL.
// Called by `postbuild` so every Vercel deploy migrates the DB automatically.
// Already-applied migrations are skipped — safe to run as many times as needed.

import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.POSTGRES_URL) {
    // Local builds without a DB connection just skip — not an error.
    console.log('No POSTGRES_URL set, skipping migrations.');
    return;
  }

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    // This table tracks which migration files have been applied.
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     TEXT        PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = join(__dirname, '..', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 001_, 002_, ... order

    for (const file of files) {
      const version = basename(file, '.sql');

      const { rows } = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );
      if (rows.length > 0) {
        console.log(`  skip  ${version}`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf8');

      // Each migration runs in a transaction so a partial failure rolls back cleanly.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await client.query('COMMIT');
        console.log(`  apply ${version}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('Migrations done.');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
