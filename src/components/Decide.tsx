import { useState } from 'react';
import type { AppState, CustomSolution } from '../types';
import { SOLUTION_OPTIONS } from '../constants';
import { offloadCandidates } from '../scoring';

interface Props {
  state: AppState;
  onChange: (updater: AppState | ((prev: AppState) => AppState)) => void;
  onBack: () => void;
  onReset: () => void;
}

// Blank form state for adding a new custom solution
const EMPTY_FORM = { title: '', pros: '', cons: '' };

export default function Decide({ state, onChange, onBack, onReset }: Props) {
  const [addingForm, setAddingForm] = useState<typeof EMPTY_FORM | null>(null);
  // Track the in-progress comment text per solution id
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  // Graceful fallback for sessions created before these fields existed
  const customSolutions: CustomSolution[] = state.customSolutions ?? [];
  const comments: Record<string, string[]> = state.comments ?? {};

  const candidates = offloadCandidates(state.tasks, state.weights);
  const heaviest = candidates.slice(0, 3).map(t => t.name);
  const icky = candidates.filter(t => t.ick >= 2).map(t => t.name);
  const assignedCount = state.tasks.filter(
    t => t.assignment !== 'na' && t.assignment !== 'outsource'
  ).length;

  function toggleOption(id: string) {
    onChange(s => ({ ...s, options: { ...s.options, [id]: !s.options[id] } }));
  }

  // ---- Custom solutions ----

  function saveCustomSolution() {
    if (!addingForm || !addingForm.title.trim()) return;
    const solution: CustomSolution = {
      id: `custom-${Date.now()}`,
      title: addingForm.title.trim(),
      pros: addingForm.pros.split('\n').map(s => s.trim()).filter(Boolean),
      cons: addingForm.cons.split('\n').map(s => s.trim()).filter(Boolean),
    };
    onChange(s => ({
      ...s,
      customSolutions: [...(s.customSolutions ?? []), solution],
      options: { ...s.options, [solution.id]: false },
    }));
    setAddingForm(null);
  }

  function deleteCustomSolution(id: string) {
    onChange(s => ({
      ...s,
      customSolutions: (s.customSolutions ?? []).filter(sol => sol.id !== id),
      options: Object.fromEntries(Object.entries(s.options).filter(([k]) => k !== id)),
      comments: Object.fromEntries(Object.entries(s.comments ?? {}).filter(([k]) => k !== id)),
    }));
  }

  // ---- Comments ----

  function addComment(solutionId: string) {
    const text = (commentDraft[solutionId] ?? '').trim();
    if (!text) return;
    onChange(s => ({
      ...s,
      comments: {
        ...(s.comments ?? {}),
        [solutionId]: [...(s.comments?.[solutionId] ?? []), text],
      },
    }));
    setCommentDraft(d => ({ ...d, [solutionId]: '' }));
  }

  function deleteComment(solutionId: string, index: number) {
    onChange(s => ({
      ...s,
      comments: {
        ...(s.comments ?? {}),
        [solutionId]: (s.comments?.[solutionId] ?? []).filter((_, i) => i !== index),
      },
    }));
  }

  function CommentsSection({ solutionId }: { solutionId: string }) {
    const list = comments[solutionId] ?? [];
    const draft = commentDraft[solutionId] ?? '';
    return (
      <div className="comments">
        {list.length > 0 && (
          <ul className="comment-list">
            {list.map((text, i) => (
              <li key={i}>
                <span>{text}</span>
                <button
                  className="comment-del"
                  onClick={() => deleteComment(solutionId, i)}
                  aria-label="Delete comment"
                >✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="comment-input">
          <input
            type="text"
            placeholder="Add a comment…"
            value={draft}
            onChange={e => setCommentDraft(d => ({ ...d, [solutionId]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') addComment(solutionId); }}
            aria-label="New comment"
          />
          <button onClick={() => addComment(solutionId)}>Add</button>
        </div>
      </div>
    );
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

        {/* Built-in solution options */}
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
              <CommentsSection solutionId={opt.id} />
            </div>
          );
        })}

        {/* Custom solutions added by the partners */}
        {customSolutions.map(sol => {
          const on = !!state.options[sol.id];
          return (
            <div key={sol.id} className={`opt custom-opt${on ? ' on' : ''}`}>
              <div className="opthead">
                <div className="ot">{sol.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="otoggle" onClick={() => toggleOption(sol.id)}>
                    {on ? 'Considering ✓' : 'Consider'}
                  </button>
                  <button
                    className="opt-delete"
                    onClick={() => deleteCustomSolution(sol.id)}
                    aria-label="Delete this solution"
                  >✕</button>
                </div>
              </div>
              {(sol.pros.length > 0 || sol.cons.length > 0) && (
                <div className="procon">
                  <div className="pro">
                    <div className="h">Pros</div>
                    <ul>{sol.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                  <div className="con">
                    <div className="h">Cons</div>
                    <ul>{sol.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                </div>
              )}
              <CommentsSection solutionId={sol.id} />
            </div>
          );
        })}

        {/* Add-solution form */}
        {addingForm ? (
          <div className="add-solution-form">
            <label htmlFor="sol-title">Solution title</label>
            <input
              id="sol-title"
              type="text"
              placeholder="e.g. Split cleaning by zone"
              value={addingForm.title}
              onChange={e => setAddingForm(f => f && ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <label htmlFor="sol-pros">Pros (one per line)</label>
            <textarea
              id="sol-pros"
              placeholder="Clear ownership…"
              value={addingForm.pros}
              onChange={e => setAddingForm(f => f && ({ ...f, pros: e.target.value }))}
            />
            <label htmlFor="sol-cons">Cons (one per line)</label>
            <textarea
              id="sol-cons"
              placeholder="Might cause friction if zones feel unequal…"
              value={addingForm.cons}
              onChange={e => setAddingForm(f => f && ({ ...f, cons: e.target.value }))}
            />
            <div className="add-solution-actions">
              <button className="btn-solid" onClick={saveCustomSolution}>
                Save solution
              </button>
              <button className="btn-ghost" onClick={() => setAddingForm(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="add-solution-btn"
            onClick={() => setAddingForm(EMPTY_FORM)}
          >
            + Add our own solution
          </button>
        )}

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
