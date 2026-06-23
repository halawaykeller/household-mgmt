import { useState } from 'react';
import type { AppState, Task, Seat } from '../../types';
import { summarize, scoreTask } from '../../scoring';
import { CATEGORY_ORDER } from '../../constants';
import Beam from './Beam';
import TaskRow from './TaskRow';
import Compare from './Compare';

type ScoreView = 'mine' | 'theirs' | 'compare';

interface Props {
  seat: Seat;
  myName: string;
  theirName: string;
  state: AppState;
  onChange: (updater: AppState | ((prev: AppState) => AppState)) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Score({ seat, myName, theirName, state, onChange, onBack, onNext }: Props) {
  const [view, setView] = useState<ScoreView>('mine');

  const theirSeat: Seat = seat === 'a' ? 'b' : 'a';
  const myData    = state[seat];
  const theirData = state[theirSeat];

  const summary = summarize(myData.tasks, myData.weights);

  function updateMyTask(id: string, updated: Task) {
    onChange(s => ({
      ...s,
      [seat]: { ...s[seat], tasks: s[seat].tasks.map(t => t.id === id ? updated : t) },
    }));
  }

  function deleteMyTask(id: string) {
    onChange(s => ({
      ...s,
      [seat]: { ...s[seat], tasks: s[seat].tasks.filter(t => t.id !== id) },
    }));
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
    onChange(s => ({
      ...s,
      [seat]: { ...s[seat], tasks: [...s[seat].tasks, newTask] },
    }));
  }

  function updateWeights(patch: Partial<AppState['a']['weights']>) {
    onChange(s => ({
      ...s,
      [seat]: { ...s[seat], weights: { ...s[seat].weights, ...patch } },
    }));
  }

  const theirReady = theirData.tasks.some(t => t.assignment !== 'na');

  return (
    <>
      {/* View toggle */}
      <div className="score-viewbar">
        <div className="viewseg">
          <button className={view === 'mine' ? 'on' : ''} onClick={() => setView('mine')}>
            {myName}'s view
          </button>
          <button
            className={view === 'theirs' ? 'on' : ''}
            onClick={() => setView('theirs')}
            title={!theirReady ? `${theirName} hasn't assigned tasks yet` : undefined}
          >
            {theirName}'s view
          </button>
          <button className={view === 'compare' ? 'on' : ''} onClick={() => setView('compare')}>
            Compare
          </button>
        </div>
        {view === 'theirs' && !theirReady && (
          <span className="waiting-badge" style={{ marginLeft: 10 }}>
            {theirName} hasn't scored yet
          </span>
        )}
      </div>

      {view === 'compare' && (
        <Compare
          myName={myName}
          theirName={theirName}
          myData={myData}
          theirData={theirData}
        />
      )}

      {view === 'theirs' && (
        <div>
          <Beam summary={summarize(theirData.tasks, theirData.weights)} />
          <div className="readonly-notice">
            {theirName}'s view — read only
          </div>
          {CATEGORY_ORDER.map(category => {
            const tasks = theirData.tasks.filter(t => t.category === category);
            if (!tasks.length) return null;
            return (
              <div key={category} className="cat">
                <div className="cathead">
                  <h3>{category}</h3>
                </div>
                <div className="rows">
                  {tasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      weights={theirData.weights}
                      readOnly
                      onUpdate={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'mine' && (
        <>
          <Beam summary={summary} />

          <details className="method">
            <summary>How the score works (tune the weights)</summary>
            <div className="methodbody">
              <p style={{ marginTop: 10 }}>
                Raw time undercounts the work nobody sees. Two dials weight that in.{' '}
                <b>Mental</b> (0–3) = ongoing noticing/planning/remembering.{' '}
                <b>Ick</b> (0–2) = the "nobody wants this" factor.
              </p>
              <div className="sliderrow">
                <label htmlFor="w-mental">Mental-load weight</label>
                <input
                  id="w-mental"
                  type="range" min="0" max="2" step="0.25"
                  value={myData.weights.mental}
                  onChange={e => updateWeights({ mental: parseFloat(e.target.value) })}
                />
                <span className="val">{myData.weights.mental}×</span>
              </div>
              <div className="sliderrow">
                <label htmlFor="w-ick">Ick weight</label>
                <input
                  id="w-ick"
                  type="range" min="0" max="1.5" step="0.25"
                  value={myData.weights.ick}
                  onChange={e => updateWeights({ ick: parseFloat(e.target.value) })}
                />
                <span className="val">{myData.weights.ick}×</span>
              </div>
            </div>
          </details>

          {CATEGORY_ORDER.map(category => {
            const tasks = myData.tasks.filter(t => t.category === category);
            if (!tasks.length) return null;

            const categoryPoints = tasks.reduce((sum, t) => {
              if (t.assignment === 'na' || t.assignment === 'outsource') return sum;
              return sum + scoreTask(t, myData.weights).loadPoints;
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
                      weights={myData.weights}
                      onUpdate={updated => updateMyTask(task.id, updated)}
                      onDelete={() => deleteMyTask(task.id)}
                    />
                  ))}
                  <button className="addrow" onClick={() => addTask(category)}>
                    + add a task
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="navfoot">
        <button className="btn-ghost" onClick={onBack}>← Back to align</button>
        <button className="btn-solid" onClick={onNext}>Next: decide how to split →</button>
      </div>
    </>
  );
}
