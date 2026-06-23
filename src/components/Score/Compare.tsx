import { summarize } from '../../scoring';
import { CATEGORY_ORDER } from '../../constants';
import type { PersonData, Assignment } from '../../types';

interface Props {
  myName: string;
  theirName: string;
  myData: PersonData;
  theirData: PersonData;
}

const ASSIGN_LABEL: Record<Assignment, string> = {
  me: 'Me',
  partner: 'Partner',
  both: 'Both',
  outsource: 'Out',
  na: 'N/A',
};

function assignColor(a: Assignment): string {
  return { me: 'var(--you)', partner: 'var(--partner)', both: 'var(--both)', outsource: 'var(--hk)', na: 'var(--na)' }[a];
}

// Two tasks "agree" when both people put the same task on the same person
// (accounting for the fact that "me" in my list = "partner" in their list).
function agree(mine: Assignment, theirs: Assignment): boolean {
  if (mine === 'both' && theirs === 'both') return true;
  if (mine === 'outsource' && theirs === 'outsource') return true;
  if (mine === 'na' && theirs === 'na') return true;
  if (mine === 'me' && theirs === 'partner') return true;
  if (mine === 'partner' && theirs === 'me') return true;
  return false;
}

export default function Compare({ myName, theirName, myData, theirData }: Props) {
  const mySummary   = summarize(myData.tasks,   myData.weights);
  const theirSummary = summarize(theirData.tasks, theirData.weights);

  // Build a lookup of their tasks by id for fast comparison
  const theirById = Object.fromEntries(theirData.tasks.map(t => [t.id, t]));

  let agreements = 0, total = 0;
  for (const t of myData.tasks) {
    const theirs = theirById[t.id];
    if (!theirs) continue;
    if (t.assignment !== 'na' || theirs.assignment !== 'na') {
      total++;
      if (agree(t.assignment, theirs.assignment)) agreements++;
    }
  }

  return (
    <div className="compare-view">
      {/* Side-by-side beams */}
      <div className="compare-beams">
        <MiniBeam name={myName} summary={mySummary} side="left" />
        <MiniBeam name={theirName} summary={theirSummary} side="right" />
      </div>

      {/* Agreement summary */}
      {total > 0 && (
        <div className="compare-summary">
          <b>{agreements}</b> of <b>{total}</b> assigned tasks agree on who does it
          {agreements === total
            ? ' — fully aligned! ✓'
            : ` — ${total - agreements} to talk through.`}
        </div>
      )}

      {/* Task-by-task comparison */}
      {CATEGORY_ORDER.map(category => {
        const tasks = myData.tasks.filter(t => t.category === category);
        if (!tasks.length) return null;

        return (
          <div key={category} className="cat">
            <div className="cathead">
              <h3>{category}</h3>
            </div>
            <div className="rows compare-rows">
              <div className="compare-row compare-header">
                <span>Task</span>
                <span>{myName}</span>
                <span>{theirName}</span>
                <span></span>
              </div>
              {tasks.map(t => {
                const theirs = theirById[t.id];
                const isAgreed = theirs ? agree(t.assignment, theirs.assignment) : null;
                return (
                  <div key={t.id} className={`compare-row${isAgreed === false ? ' disagree' : ''}`}>
                    <span className="compare-task-name">{t.name}</span>
                    <span>
                      <span className="assign-badge" style={{ background: assignColor(t.assignment) }}>
                        {ASSIGN_LABEL[t.assignment]}
                      </span>
                    </span>
                    <span>
                      {theirs
                        ? <span className="assign-badge" style={{ background: assignColor(theirs.assignment) }}>
                            {ASSIGN_LABEL[theirs.assignment]}
                          </span>
                        : <span className="compare-na">—</span>
                      }
                    </span>
                    <span className="compare-agree-icon">
                      {isAgreed === true  && <span title="Agree">✓</span>}
                      {isAgreed === false && <span title="Disagree" style={{ color: 'var(--partner)' }}>!</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniBeam({ name, summary, side }: {
  name: string;
  summary: ReturnType<typeof summarize>;
  side: 'left' | 'right';
}) {
  const me      = side === 'left' ? summary.me      : summary.partner;
  const partner = side === 'left' ? summary.partner : summary.me;
  const deg = summary.beamAngleDeg * (side === 'right' ? -1 : 1);

  return (
    <div className="mini-beam-wrap">
      <div className="mini-beam-label">{name}'s view</div>
      <div className="mini-scale">
        <div className="mini-beamwrap">
          <div className="mini-pan left">
            <div className="who" style={{ color: 'var(--you)' }}>{name}</div>
            <div className="big">{Math.round(me.sharePercent)}%</div>
          </div>
          <div className="mini-pan right">
            <div className="who" style={{ color: 'var(--partner)' }}>Partner</div>
            <div className="big">{Math.round(partner.sharePercent)}%</div>
          </div>
          <div className="beam" style={{ transform: `rotate(${deg}deg)` }} />
          <div className="beam-post" />
          <div className="fulcrum" />
        </div>
      </div>
      <div className="mini-pts">
        {Math.round(me.loadPoints)} pts · {(me.monthlyMinutes / 60).toFixed(1)} h/mo
      </div>
    </div>
  );
}
