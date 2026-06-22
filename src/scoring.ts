// Pure scoring functions. No React, no side effects.
// Tests live in scoring.test.ts — run them before touching these formulas.

import type { Task, AppState } from './types';

export interface TaskScore {
  monthlyMinutes: number;  // raw time, unweighted
  loadPoints: number;      // weighted score used for the balance
}

// The core formula from the spec:
//   monthlyMinutes = minutesPerOccurrence × occurrencesPerMonth
//   multiplier     = (1 + weights.mental × (mental / 3)) × (1 + weights.ick × (ick / 2))
//   loadPoints     = monthlyMinutes × multiplier / 10
export function scoreTask(task: Task, weights: AppState['weights']): TaskScore {
  const monthlyMinutes = task.minutesPerOccurrence * task.occurrencesPerMonth;
  const multiplier =
    (1 + weights.mental * (task.mental / 3)) *
    (1 + weights.ick    * (task.ick    / 2));
  return {
    monthlyMinutes,
    loadPoints: (monthlyMinutes * multiplier) / 10,
  };
}

export interface PersonTotals {
  loadPoints: number;
  monthlyMinutes: number;
  sharePercent: number;  // percentage of the me+partner total (0–100)
}

export interface ScoreSummary {
  me: PersonTotals;
  partner: PersonTotals;
  outsourcePoints: number;  // load kept out of the personal balance
  beamAngleDeg: number;     // tilt of the balance beam, capped at ±9°
}

// Aggregate per-person totals from the full task list.
// 'both' splits 50/50; 'outsource' goes to its own bucket; 'na' is excluded.
export function summarize(tasks: Task[], weights: AppState['weights']): ScoreSummary {
  let mePoints = 0, meMinutes = 0;
  let partnerPoints = 0, partnerMinutes = 0;
  let outsourcePoints = 0;

  for (const task of tasks) {
    if (task.assignment === 'na') continue;

    const { loadPoints, monthlyMinutes } = scoreTask(task, weights);

    if (task.assignment === 'outsource') {
      outsourcePoints += loadPoints;
    } else if (task.assignment === 'me') {
      mePoints += loadPoints;
      meMinutes += monthlyMinutes;
    } else if (task.assignment === 'partner') {
      partnerPoints += loadPoints;
      partnerMinutes += monthlyMinutes;
    } else if (task.assignment === 'both') {
      mePoints      += loadPoints / 2;
      meMinutes     += monthlyMinutes / 2;
      partnerPoints += loadPoints / 2;
      partnerMinutes += monthlyMinutes / 2;
    }
  }

  const total = mePoints + partnerPoints;
  const meShare      = total > 0 ? (mePoints      / total) * 100 : 50;
  const partnerShare = total > 0 ? (partnerPoints / total) * 100 : 50;

  // Beam tilts toward the heavier side, capped at ±9°. Formula from mockup:
  // (fraction - 0.5) * 26, where fraction is me's share as 0–1.
  // Reaches ±9° at roughly 85%/15%, so extreme imbalance pegs the beam.
  const beamAngleDeg = Math.max(-9, Math.min(9, (meShare / 100 - 0.5) * 26));

  return {
    me:      { loadPoints: mePoints,      monthlyMinutes: meMinutes,      sharePercent: meShare },
    partner: { loadPoints: partnerPoints, monthlyMinutes: partnerMinutes, sharePercent: partnerShare },
    outsourcePoints,
    beamAngleDeg,
  };
}

// Returns the top offload candidates for the Decide phase:
// top 3 by load points among assigned tasks, plus any ick≥2 tasks.
export function offloadCandidates(tasks: Task[], weights: AppState['weights']): Task[] {
  const assigned = tasks.filter(t => t.assignment === 'me' || t.assignment === 'partner' || t.assignment === 'both');

  const scored = assigned.map(t => ({ task: t, pts: scoreTask(t, weights).loadPoints }));
  scored.sort((a, b) => b.pts - a.pts);

  const top3Ids = new Set(scored.slice(0, 3).map(s => s.task.id));
  const ickIds  = new Set(assigned.filter(t => t.ick >= 2).map(t => t.id));

  const seen = new Set<string>();
  const result: Task[] = [];
  for (const t of assigned) {
    if ((top3Ids.has(t.id) || ickIds.has(t.id)) && !seen.has(t.id)) {
      result.push(t);
      seen.add(t.id);
    }
  }
  return result;
}
