import type { AppState, Task } from '../../types';
import { summarize, scoreTask } from '../../scoring';
import { CATEGORY_ORDER } from '../../constants';
import Beam from './Beam';
import TaskRow from './TaskRow';

interface Props {
  state: AppState;
  onChange: (updater: AppState | ((prev: AppState) => AppState)) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Score({ state, onChange, onBack, onNext }: Props) {
  const summary = summarize(state.tasks, state.weights);

  function updateTask(id: string, updated: Task) {
    onChange(s => ({
      ...s,
      tasks: s.tasks.map(t => (t.id === id ? updated : t)),
    }));
  }

  function deleteTask(id: string) {
    onChange(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }

  function addTask(category: string) {
    const newTask: Task = {
      id: `u${Date.now()}`,
      category,
      name: 'New task',
      minutesPerOccurrence: 10,
      occurrencesPerMonth: 4,
      mental: 0,
      ick: 0,
      assignment: 'na',
    };
    onChange(s => ({ ...s, tasks: [...s.tasks, newTask] }));
  }

  function updateWeights(patch: Partial<AppState['weights']>) {
    onChange(s => ({ ...s, weights: { ...s.weights, ...patch } }));
  }

  return (
    <>
      <Beam summary={summary} />

      <details className="method">
        <summary>How the score works (tune the weights)</summary>
        <div className="methodbody">
          <p style={{ marginTop: 10 }}>
            Raw time undercounts the work nobody sees. Two dials weight that in.{' '}
            <b>Mental</b> (0–3) = ongoing noticing/planning/remembering, separate
            from doing. <b>Ick</b> (0–2) = the "nobody wants this" factor.
          </p>
          <div className="sliderrow">
            <label htmlFor="w-mental">Mental-load weight</label>
            <input
              id="w-mental"
              type="range"
              min="0"
              max="2"
              step="0.25"
              value={state.weights.mental}
              onChange={e => updateWeights({ mental: parseFloat(e.target.value) })}
            />
            <span className="val">{state.weights.mental}×</span>
          </div>
          <div className="sliderrow">
            <label htmlFor="w-ick">Ick weight</label>
            <input
              id="w-ick"
              type="range"
              min="0"
              max="1.5"
              step="0.25"
              value={state.weights.ick}
              onChange={e => updateWeights({ ick: parseFloat(e.target.value) })}
            />
            <span className="val">{state.weights.ick}×</span>
          </div>
        </div>
      </details>

      {CATEGORY_ORDER.map(category => {
        const tasks = state.tasks.filter(t => t.category === category);
        if (tasks.length === 0) return null;

        const categoryPoints = tasks.reduce((sum, t) => {
          if (t.assignment === 'na' || t.assignment === 'outsource') return sum;
          return sum + scoreTask(t, state.weights).loadPoints;
        }, 0);

        return (
          <div key={category} className="cat">
            <div className="cathead">
              <h3>{category}</h3>
              <span className="ctot">{Math.round(categoryPoints)} pts assigned</span>
            </div>
            <div className="rows">
              {tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  weights={state.weights}
                  onUpdate={updated => updateTask(task.id, updated)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
              <button className="addrow" onClick={() => addTask(category)}>
                + add a task
              </button>
            </div>
          </div>
        );
      })}

      <div className="navfoot">
        <button className="btn-ghost" onClick={onBack}>← Back to align</button>
        <button className="btn-solid" onClick={onNext}>Next: decide how to split →</button>
      </div>
    </>
  );
}
