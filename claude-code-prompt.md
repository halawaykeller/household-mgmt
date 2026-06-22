# Claude Code prompt — Household "Align · Score · Decide" app

> Paste this whole file into Claude Code. Drop `household-app-mockup.html` into the
> repo first and point Claude Code at it — it's the visual + behavioral source of truth,
> so the build should match its look, scoring math, and flow rather than reinventing them.

---

## What I'm building

A small two-person web app my partner and I use to negotiate household labor. It's a
**facilitation tool**, not a chore tracker — it runs one structured conversation in three
phases, in order:

1. **Align** — surface what each of us values and is bothered by, *before* tactics.
2. **Score** — inventory every task and weigh it (time × frequency, plus mental load and
   unpleasantness), assign each to a person, and see live whether the split balances.
3. **Decide** — pick a mix of solutions (housekeeper, schedule, heuristics, clean-your-own),
   set a money budget for offloading, and write the final plan.

Reference implementation of all three phases, including the exact scoring formula, the
balance-beam visualization, the default task list, and the copy, is in
`household-app-mockup.html`. Treat it as the spec. The build below is that mockup turned
into a real, maintainable app.

## Stack

- **React + TypeScript + Vite**, single-page, no router needed (phase nav is in-app state).
- **Local-first persistence**: one JSON blob in `localStorage` (key `household-asd`),
  debounced autosave on every change, restore on load, with a "Reset everything" action
  behind a confirm. No backend in v1.
- Plain CSS (CSS variables) or CSS modules — match the mockup's tokens exactly; don't pull
  in a component library. Fonts: Space Grotesk (display/numbers) + Inter (body) via Google
  Fonts, system-font fallbacks.
- No telemetry, no accounts. It's just for the two of us.

## Data model

```ts
type Assignment = 'me' | 'partner' | 'both' | 'outsource' | 'na';

interface Task {
  id: string;
  category: 'Laundry' | 'Kitchen' | 'Robots' | 'Management labor' | 'Bigger picture' | string;
  name: string;
  minutesPerOccurrence: number;
  occurrencesPerMonth: number;
  mental: 0 | 1 | 2 | 3;     // ongoing noticing/planning/remembering
  ick: 0 | 1 | 2;            // unpleasantness
  assignment: Assignment;
}

interface AppState {
  screen: 'align' | 'score' | 'decide';
  weights: { mental: number; ick: number };   // defaults 1.0 and 0.5
  align: { you: string; partner: string }[];   // one entry per alignment question
  tasks: Task[];
  options: Record<string, boolean>;            // solution id -> "we're considering it"
  budgetMonthly: string;
  plan: string;
}
```

Seed `tasks`, `align` questions, and solution `options` from the constants in the mockup
(`DEFAULTS`, `ALIGN_Q`, `OPTIONS`) verbatim — they're our actual content, not placeholders.

## Scoring (match exactly)

```
monthlyMinutes = minutesPerOccurrence * occurrencesPerMonth
multiplier     = (1 + weights.mental * (mental / 3)) * (1 + weights.ick * (ick / 2))
loadPoints     = monthlyMinutes * multiplier / 10
```

Per-person totals: `me` and `partner` take full load; `both` splits 50/50; `outsource`
goes to a separate bucket (excluded from the person balance); `na` excluded. Show each
person's **share %**, **load points**, and **raw hours/month** (hours ignore the weights —
show the unvarnished time alongside the weighted score). The balance beam tilts proportional
to the share gap, capped at ±9°.

## Screens

**Phase 1 — Align.** The six questions from the mockup, each with two side-by-side
textareas (You / Partner), color-coded (teal / clay). Intro copy: answer separately, compare
after, mismatches are the conversation. No scoring here.

**Phase 2 — Score.** Balance beam at top (signature element — keep the tilt animation,
respect `prefers-reduced-motion`). Collapsible "how the score works" with the two weight
sliders. Tasks grouped by category; each row has editable name, minutes, frequency, mental
(0–3 select), ick (0–2 select), computed load points, a 5-way assignment segmented control,
delete, and "+ add a task" per category. Live recompute on every edit.

**Phase 3 — Decide.** A computed "offload candidates" callout (top 3 by load points + any
ick≥2 tasks currently on a person). Monthly budget input. The four solution option cards
with pros/cons and a "considering" toggle (non-exclusive). A free-text "Our plan" box —
prompt explicitly for the sick/tired contingency in both directions, since that's the part
we most want to nail down.

## Quality bar

- Responsive to mobile (we'll use it on a phone on the couch): single-column rows, beam
  scales down, alignment columns stack.
- Keyboard-accessible: real `<button>`/`<select>`, visible focus, labels on inputs.
- No data loss: autosave must not drop edits mid-typing; reset is the only destructive path
  and it confirms first.
- Keep it one cohesive product visually — same palette and type across all three phases.

## Build order

1. Scaffold Vite + React + TS, drop in the mockup for reference, set up the CSS tokens.
2. State + persistence layer (load/save/reset, typed `AppState`).
3. Scoring module with unit tests for the formula and the per-person aggregation.
4. Phase 2 (Score) first — it's the core and proves the model — then Phase 1, then Phase 3.
5. Phase nav + screen transitions last.

## Later (don't build yet, just leave room)

- Two-device sync so we can each edit from our own phones (small backend or a hosted KV).
- A "back to work / leave ends" view that re-weights once parental leave is over.
- Export the final plan to a shareable note.

When you're done, run it and walk me through each phase so we can sanity-check the scoring
against our real tasks.
