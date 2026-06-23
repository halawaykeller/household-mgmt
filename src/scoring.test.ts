import { describe, it, expect } from 'vitest';
import { scoreTask, summarize, offloadCandidates } from './scoring';
import type { Task } from './types';

const DEFAULT_WEIGHTS = { mental: 1.0, ick: 0.5 };

// Helper to build a minimal Task
function task(overrides: Partial<Task> & { id?: string }): Task {
  return {
    id: overrides.id ?? 't0',
    category: 'Test',
    name: 'Test task',
    minutesPerOccurrence: 10,
    occurrencesPerMonth: 4,
    mental: 0,
    ick: 0,
    assignment: 'na',
    ...overrides,
  };
}

describe('scoreTask', () => {
  it('no mental/ick load — multiplier is 1, pts = minutes/10', () => {
    const { loadPoints, monthlyMinutes } = scoreTask(
      task({ minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 0, ick: 0 }),
      DEFAULT_WEIGHTS
    );
    expect(monthlyMinutes).toBe(80);
    expect(loadPoints).toBe(8); // 80 / 10
  });

  it('max mental (3) with weight 1.0 doubles the score', () => {
    // multiplier = (1 + 1.0*(3/3)) * (1 + 0.5*(0/2)) = 2 * 1 = 2
    const { loadPoints } = scoreTask(
      task({ minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 3, ick: 0 }),
      DEFAULT_WEIGHTS
    );
    expect(loadPoints).toBe(16); // 80 * 2 / 10
  });

  it('max ick (2) with weight 0.5 adds 50%', () => {
    // multiplier = (1 + 1.0*(0/3)) * (1 + 0.5*(2/2)) = 1 * 1.5 = 1.5
    const { loadPoints } = scoreTask(
      task({ minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 0, ick: 2 }),
      DEFAULT_WEIGHTS
    );
    expect(loadPoints).toBe(12); // 80 * 1.5 / 10
  });

  it('max mental + max ick stacks multiplicatively', () => {
    // multiplier = (1 + 1.0*(3/3)) * (1 + 0.5*(2/2)) = 2 * 1.5 = 3
    const { loadPoints } = scoreTask(
      task({ minutesPerOccurrence: 10, occurrencesPerMonth: 10, mental: 3, ick: 2 }),
      DEFAULT_WEIGHTS
    );
    expect(loadPoints).toBe(30); // 100 * 3 / 10
  });

  it('respects custom weights', () => {
    // With mental weight 0: mental load has no effect
    const { loadPoints } = scoreTask(
      task({ minutesPerOccurrence: 10, occurrencesPerMonth: 10, mental: 3, ick: 0 }),
      { mental: 0, ick: 0.5 }
    );
    expect(loadPoints).toBe(10); // 100 * 1 / 10 — mental ignored
  });
});

describe('summarize', () => {
  it('single task assigned to me', () => {
    const tasks = [task({ assignment: 'me', minutesPerOccurrence: 10, occurrencesPerMonth: 10 })];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.me.monthlyMinutes).toBe(100);
    expect(s.me.sharePercent).toBe(100);
    expect(s.partner.sharePercent).toBe(0);
    expect(s.beamAngleDeg).toBe(9); // capped at max tilt
  });

  it('50/50 split has beam at 0°', () => {
    const tasks = [task({ assignment: 'both', minutesPerOccurrence: 10, occurrencesPerMonth: 10 })];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.me.sharePercent).toBe(50);
    expect(s.partner.sharePercent).toBe(50);
    expect(s.beamAngleDeg).toBe(0);
  });

  it('"both" splits load 50/50 between people', () => {
    const tasks = [task({ assignment: 'both', minutesPerOccurrence: 20, occurrencesPerMonth: 4 })];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.me.monthlyMinutes).toBe(40);
    expect(s.partner.monthlyMinutes).toBe(40);
  });

  it('"outsource" excluded from personal balance', () => {
    const tasks = [
      task({ id: 't0', assignment: 'outsource', minutesPerOccurrence: 100, occurrencesPerMonth: 10 }),
      task({ id: 't1', assignment: 'me', minutesPerOccurrence: 10, occurrencesPerMonth: 10 }),
    ];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.outsourcePoints).toBeGreaterThan(0);
    expect(s.me.sharePercent).toBe(100); // outsource not in denominator
  });

  it('"na" tasks are fully excluded', () => {
    const tasks = [task({ assignment: 'na', minutesPerOccurrence: 999, occurrencesPerMonth: 999 })];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.me.loadPoints).toBe(0);
    expect(s.partner.loadPoints).toBe(0);
  });

  it('beam angle is capped at ±9°', () => {
    const tasks = [task({ assignment: 'me', minutesPerOccurrence: 1000, occurrencesPerMonth: 100 })];
    const s = summarize(tasks, DEFAULT_WEIGHTS);
    expect(s.beamAngleDeg).toBe(9);
  });
});

describe('offloadCandidates', () => {
  it('returns top 3 by load points', () => {
    const tasks = [
      task({ id: 't0', assignment: 'me', minutesPerOccurrence: 100, occurrencesPerMonth: 10 }), // highest
      task({ id: 't1', assignment: 'me', minutesPerOccurrence: 50,  occurrencesPerMonth: 10 }),
      task({ id: 't2', assignment: 'me', minutesPerOccurrence: 30,  occurrencesPerMonth: 10 }),
      task({ id: 't3', assignment: 'me', minutesPerOccurrence: 10,  occurrencesPerMonth: 10 }),
    ];
    const candidates = offloadCandidates(tasks, DEFAULT_WEIGHTS);
    const ids = candidates.map(t => t.id);
    expect(ids).toContain('t0');
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
    expect(ids).not.toContain('t3');
  });

  it('always includes ick≥2 tasks even if not top 3', () => {
    const tasks = [
      task({ id: 't0', assignment: 'me', minutesPerOccurrence: 1, occurrencesPerMonth: 1, ick: 2 }),
    ];
    const candidates = offloadCandidates(tasks, DEFAULT_WEIGHTS);
    expect(candidates.map(t => t.id)).toContain('t0');
  });

  it('excludes na and outsource tasks', () => {
    const tasks = [
      task({ id: 't0', assignment: 'na',       minutesPerOccurrence: 1000, occurrencesPerMonth: 100 }),
      task({ id: 't1', assignment: 'outsource', minutesPerOccurrence: 1000, occurrencesPerMonth: 100 }),
    ];
    expect(offloadCandidates(tasks, DEFAULT_WEIGHTS)).toHaveLength(0);
  });
});
