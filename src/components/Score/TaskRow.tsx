import { useRef } from 'react';
import type { Task, Assignment, PersonData } from '../../types';
import { scoreTask } from '../../scoring';

interface Props {
  task: Task;
  weights: PersonData['weights'];
  onUpdate: (updated: Task) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const ASSIGNMENTS: { key: Assignment; label: string }[] = [
  { key: 'me',       label: 'You'  },
  { key: 'partner',  label: 'Ptnr' },
  { key: 'both',     label: 'Both' },
  { key: 'outsource',label: 'Out'  },
  { key: 'na',       label: 'N/A'  },
];

export default function TaskRow({ task, weights, onUpdate, onDelete, readOnly = false }: Props) {
  const scoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loadPoints } = scoreTask(task, weights);

  function update(patch: Partial<Task>) {
    onUpdate({ ...task, ...patch });
  }

  // Debounce number input so the beam doesn't thrash while typing
  function handleNumInput(field: 'minutesPerOccurrence' | 'occurrencesPerMonth', raw: string) {
    const val = parseFloat(raw) || 0;
    if (scoreTimer.current) clearTimeout(scoreTimer.current);
    scoreTimer.current = setTimeout(() => update({ [field]: val }), 300);
  }

  return (
    <div className={`row${readOnly ? ' row-readonly' : ''}`}>
      <div>
        <div className="rname">
          <input
            defaultValue={task.name}
            onBlur={e => !readOnly && update({ name: e.target.value })}
            readOnly={readOnly}
            aria-label="Task name"
          />
        </div>
        <div className="meta">
          <span className="fld">
            <input
              className="num"
              type="number"
              min="0"
              defaultValue={task.minutesPerOccurrence}
              onChange={e => handleNumInput('minutesPerOccurrence', e.target.value)}
              aria-label="Minutes per occurrence"
            />
            <span>min</span>
          </span>
          <span className="fld">
            <input
              className="num"
              type="number"
              min="0"
              defaultValue={task.occurrencesPerMonth}
              onChange={e => handleNumInput('occurrencesPerMonth', e.target.value)}
              aria-label="Times per month"
            />
            <span>×/mo</span>
          </span>
          <span className="fld">
            <span>mental</span>
            <select
              value={task.mental}
              onChange={e => update({ mental: parseInt(e.target.value) as Task['mental'] })}
              aria-label="Mental load 0-3"
            >
              {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
          <span className="fld">
            <span>ick</span>
            <select
              value={task.ick}
              onChange={e => update({ ick: parseInt(e.target.value) as Task['ick'] })}
              aria-label="Unpleasantness 0-2"
            >
              {[0, 1, 2].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
          <span className="load">{Math.round(loadPoints)} pts</span>
        </div>
      </div>

      <div className="rside">
        <div className="assign" role="group" aria-label="Assign to">
          {ASSIGNMENTS.map(({ key, label }) => (
            <button
              key={key}
              className={`assign-${key}${task.assignment === key ? ' on' : ''}`}
              onClick={() => update({ assignment: key })}
              aria-pressed={task.assignment === key}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="del" onClick={onDelete} aria-label="Delete task">✕</button>
      </div>
    </div>
  );
}
