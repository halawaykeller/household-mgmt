-- Run this once against your Postgres database (local or Vercel).
-- psql $POSTGRES_URL < schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- needed for gen_random_uuid()

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state       JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
