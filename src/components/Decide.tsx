import type { AppState } from '../types';
import { SOLUTION_OPTIONS } from '../constants';
import { offloadCandidates } from '../scoring';

interface Props {
  state: AppState;
  onChange: (updater: AppState | ((prev: AppState) => AppState)) => void;
  onBack: () => void;
  onReset: () => void;
}

export default function Decide({ state, onChange, onBack, onReset }: Props) {
  const candidates = offloadCandidates(state.tasks, state.weights);
  const heaviest = candidates.slice(0, 3).map(t => t.name);
  const icky = candidates.filter(t => t.ick >= 2).map(t => t.name);

  const assignedCount = state.tasks.filter(
    t => t.assignment !== 'na' && t.assignment !== 'outsource'
  ).length;

  function toggleOption(id: string) {
    onChange(s => ({
      ...s,
      options: { ...s.options, [id]: !s.options[id] },
    }));
  }

  return (
    <>
      <div className="card">
        <h2 className="sec">Decide</h2>
        <p className="lead">
          Now that you can see the load and where it's tilted, choose how to
          handle it. These options aren't mutually exclusive — most households run
          a mix (schedule the shared stuff, outsource the worst stuff, heuristics
          for the rest). Where Phase 1 showed you're not aligned, settle that
          before picking a tactic for that area.
        </p>

        <div className="pressure">
          {assignedCount === 0 ? (
            <><b>Offload candidates</b> appear here once you've assigned tasks in Phase 2.</>
          ) : (
            <>
              <b>Where to point your money & schedule.</b>
              {heaviest.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  Heaviest load right now: {heaviest.join(', ')}.
                </div>
              )}
              {icky.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  Worst to do (good outsource candidates): {[...new Set(icky)].join(', ')}.
                </div>
              )}
            </>
          )}
        </div>

        <div className="budget">
          <label htmlFor="budget-input" style={{ fontWeight: 550 }}>
            Monthly budget to offload work: $
          </label>
          <input
            id="budget-input"
            type="number"
            min="0"
            placeholder="0"
            value={state.budgetMonthly}
            onChange={e => onChange(s => ({ ...s, budgetMonthly: e.target.value }))}
          />
          <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            — what you'll spend on housekeeper, laundry service, etc.
          </span>
        </div>

        {SOLUTION_OPTIONS.map(opt => {
          const on = !!state.options[opt.id];
          return (
            <div key={opt.id} className={`opt${on ? ' on' : ''}`}>
              <div className="opthead">
                <div className="ot">{opt.title}</div>
                <button className="otoggle" onClick={() => toggleOption(opt.id)}>
                  {on ? 'Considering ✓' : 'Consider'}
                </button>
              </div>
              <div className="procon">
                <div className="pro">
                  <div className="h">Pros</div>
                  <ul>{opt.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div className="con">
                  <div className="h">Cons</div>
                  <ul>{opt.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              </div>
            </div>
          );
        })}

        <h2 className="sec" style={{ marginTop: 18 }}>Our plan</h2>
        <p className="lead" style={{ marginBottom: 8 }}>
          Write the agreement in plain words. Include the part your notes nailed:
          what happens when one of you is sick or slammed, and what the other
          gives in return.
        </p>
        <div className="plan">
          <textarea
            value={state.plan}
            onChange={e => onChange(s => ({ ...s, plan: e.target.value }))}
            placeholder="e.g. Yolanda every other week ($x). Dishes by Resistor heuristic. Laundromat runs alternate weeks. Supplies: one person owns the reorder list. When someone's sick, the other covers their tasks that week, no scorekeeping…"
          />
        </div>
      </div>

      <div className="navfoot">
        <button className="btn-ghost" onClick={onBack}>← Back to score</button>
        <button className="btn-ghost" onClick={onReset}>Reset everything</button>
      </div>
    </>
  );
}
