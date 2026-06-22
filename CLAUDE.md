# CLAUDE.md — Household Align · Score · Decide

This file is for Claude Code. It tells you what we're building, how we work,
and what mistakes to avoid. Read it before touching any code.

---

## What this app is

A two-person household labor negotiation tool. It runs a structured three-phase
conversation:

1. **Align** — surface values and pain points before tactics
2. **Score** — inventory tasks, weigh them (time × mental load × unpleasantness),
   assign to a person, see live whether the split is fair
3. **Decide** — pick solutions (housekeeper, schedule, heuristics), set a budget,
   write the final plan

The visual spec and all real content (task list, alignment questions, solution
options, scoring formula) lives in `household-app-mockup.html`. When in doubt,
match the mockup exactly — don't reinvent copy, colors, or layout.

---

## Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React + TypeScript + Vite                     |
| Backend    | Python (FastAPI) via Vercel Serverless        |
| Database   | PostgreSQL (Vercel Postgres / Neon)           |
| Deploy     | Vercel (frontend + API in one project)        |
| Tests (FE) | Vitest                                        |
| Tests (BE) | pytest                                        |

### Why this stack

- **React + Vite**: fast iteration, TypeScript catches bugs early
- **Python backend**: clean for data logic, good Postgres libraries, Vercel supports it
- **Postgres**: sessions and app state are simple JSON blobs — one table is enough for v1
- **Vercel**: single deploy for frontend + Python API + managed Postgres, zero ops

---

## Project structure

```
household-mgmt/
├── CLAUDE.md                  ← you are here
├── household-app-mockup.html  ← visual + behavioral spec, do not delete
├── vercel.json                ← routes /api/* to Python, everything else to Vite
├── package.json               ← Vite + React + TS + Vitest
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx               ← React entry
│   ├── App.tsx                ← phase state machine + API sync
│   ├── types.ts               ← shared TypeScript types
│   ├── scoring.ts             ← scoring formula (pure functions, tested)
│   ├── api.ts                 ← fetch wrapper for backend
│   └── components/
│       ├── PhaseNav.tsx
│       ├── Align.tsx
│       ├── Score/
│       │   ├── index.tsx
│       │   ├── Beam.tsx       ← balance beam visualization
│       │   └── TaskRow.tsx
│       └── Decide.tsx
├── api/
│   ├── requirements.txt
│   └── index.py               ← FastAPI app, all routes
├── tests/
│   └── test_scoring.py        ← pytest: scoring formula unit tests
└── src/scoring.test.ts        ← Vitest: same formula, FE side
```

---

## Session model (v1)

No login. Each household gets a UUID session ID on first visit. The ID is stored
in localStorage and encoded in a shareable URL (`/?s=<uuid>`).

```
sessions table
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
  state       JSONB NOT NULL   -- full AppState blob
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()
```

API surface (3 endpoints only):

```
POST /api/sessions          → create session, return {id, state}
GET  /api/sessions/{id}     → fetch current state
PUT  /api/sessions/{id}     → replace state, return updated state
```

Frontend autosaves on every change (debounced 500ms). On load, reads session ID
from URL or localStorage, fetches from API. If none, creates one.

---

## Data model (TypeScript types in src/types.ts)

```ts
type Assignment = 'me' | 'partner' | 'both' | 'outsource' | 'na';

interface Task {
  id: string;
  category: string;
  name: string;
  minutesPerOccurrence: number;
  occurrencesPerMonth: number;
  mental: 0 | 1 | 2 | 3;   // ongoing noticing/planning/remembering
  ick: 0 | 1 | 2;          // unpleasantness
  assignment: Assignment;
}

interface AppState {
  screen: 'align' | 'score' | 'decide';
  weights: { mental: number; ick: number };  // defaults 1.0 and 0.5
  align: { you: string; partner: string }[]; // one per alignment question
  tasks: Task[];
  options: Record<string, boolean>;          // solution id → "we're considering it"
  budgetMonthly: string;
  plan: string;
}
```

---

## Scoring formula (must match exactly)

```
monthlyMinutes = minutesPerOccurrence × occurrencesPerMonth
multiplier     = (1 + weights.mental × (mental / 3)) × (1 + weights.ick × (ick / 2))
loadPoints     = monthlyMinutes × multiplier / 10
```

Per-person totals:
- `me` and `partner` take full load
- `both` splits 50/50
- `outsource` goes to a separate bucket (excluded from the person balance)
- `na` excluded from everything

Display per person: **share %**, **load points**, **raw hours/month** (hours ignore
weights — show unvarnished time alongside the weighted score).

Balance beam tilts proportional to the share gap, capped at ±9°.

This formula must be implemented and tested before any UI is built.

---

## Build order

Work in this order. Don't start the next step until the current step is working
end-to-end — running, tested, and manually verified.

1. **Scaffold** — Vite + React + TS, FastAPI skeleton, Postgres schema, vercel.json
2. **Session API** — POST/GET/PUT sessions endpoints with real Postgres, pytest green
3. **Scoring module** — pure functions in both `src/scoring.ts` and `api/scoring.py`,
   unit tests in both Vitest and pytest before any UI
4. **Phase 2 (Score)** — the core screen: balance beam, task table, live scoring,
   connected to real API
5. **Phase 1 (Align)** — the six alignment questions
6. **Phase 3 (Decide)** — offload candidates, budget, solution cards, plan text
7. **Phase nav + transitions** — connect the screens, verify localStorage fallback

---

## How-to-dev rules (encode these, follow them)

**Test first, then implement.** Write the test for a pure function before writing
the function. Tests for the scoring formula must pass before building any UI
that depends on it.

**End-to-end before next step.** Every build phase must produce something you can
actually use — run the API, hit the endpoint with curl, see the score render.
Don't accumulate half-finished layers.

**Keep it simple.** This is a two-person app. A single Postgres table is fine.
One Python file is fine. Don't add abstraction layers until a concrete second use
case demands them.

**No overengineering.** No ORM (use `asyncpg` or `psycopg` directly). No Redux
(React state + context is enough). No component library (plain CSS, match the
mockup tokens). No monorepo tooling. No microservices.

**Comments explain why, not what.** Code names should make what obvious. Only
comment when there's a non-obvious constraint, a subtle invariant, or a
gotcha a future reader would trip on.

**Match the mockup.** Colors, fonts, copy, and scoring math come from
`household-app-mockup.html`. Don't improvise.

---

## Local development

```bash
# Frontend
npm install
npm run dev          # Vite dev server on :5173

# Backend
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn index:app --reload --port 8000

# Tests
npm run test                    # Vitest
cd api && pytest                # pytest

# DB (local)
createdb household_mgmt
psql household_mgmt < schema.sql
```

Set `POSTGRES_URL` in `.env.local` (frontend uses Vite env vars to reach API,
backend reads it directly).

---

## Vercel deployment

- Frontend builds to `/dist` via `npm run build` (Vite)
- `vercel.json` routes `/api/*` to `api/index.py` (FastAPI + Mangum)
- `POSTGRES_URL` set in Vercel environment variables
- Every push to `main` autodeploys

---

## Later (don't build yet)

- Two-device real-time sync (WebSocket or polling) — the session model already
  supports this; just add a sync mechanism
- Session sharing UI — "share this link with your partner" flow
- Public sessions — anonymous households, no accounts
- Export the final plan to a note/PDF
- Parental-leave re-weighting view

---

## CSS tokens (must match mockup exactly)

```css
--bg: #E9EBE4;      --ink: #1E2420;     --muted: #6E746C;
--surface: #FBFBF8; --line: #D8DBD1;
--you: #1F6E68;     --partner: #BC6A38; --both: #6E6580;
--hk: #97A09A;      --na: #C2C6BD;
--you-soft: #E2EEEC; --partner-soft: #F4E5D9;
--radius: 14px;
--display: 'Space Grotesk';  --body: 'Inter';
```
