import type { Seat } from '../types';
import { ALIGN_QUESTIONS } from '../constants';

interface Props {
  seat: Seat;
  myName: string;
  theirName: string;
  myAnswers: string[];
  theirAnswers: string[];
  onChange: (answers: string[]) => void;
  onNext: () => void;
}

export default function Align({ myName, theirName, myAnswers, theirAnswers, onChange, onNext }: Props) {
  function update(i: number, value: string) {
    const next = [...myAnswers];
    next[i] = value;
    onChange(next);
  }

  const theirCount = theirAnswers.filter(a => a.trim()).length;
  const partnerReady = theirCount === ALIGN_QUESTIONS.length;

  return (
    <>
      <div className="card">
        <h2 className="sec">Align first</h2>
        <p className="lead">
          Answer these on your own, then read each other's. Most household
          friction isn't about who does the dishes — it's that "clean enough"
          means something different to each of you. The goal here isn't
          agreement yet. It's an honest map of where you already agree and
          where you don't.
        </p>
        <div className="align-note">
          Fill in your column without looking at your partner's. Compare after.
          Mismatches aren't problems — they're the conversation.
        </div>

        <div className="qhead">
          <div className="you-label">{myName}</div>
          <div className="partner-label">
            {theirName}
            {!partnerReady && theirCount === 0 && (
              <span className="waiting-badge">hasn't answered yet</span>
            )}
            {!partnerReady && theirCount > 0 && (
              <span className="waiting-badge">{theirCount}/{ALIGN_QUESTIONS.length} answered</span>
            )}
          </div>
        </div>

        {ALIGN_QUESTIONS.map((q, i) => (
          <div key={i} className="qblock">
            <div className="qtext">{i + 1}. {q}</div>
            <div className="qpair">
              <textarea
                className="you-ta"
                placeholder={`${myName}…`}
                value={myAnswers[i] ?? ''}
                onChange={e => update(i, e.target.value)}
                aria-label={`${myName}: ${q}`}
              />
              <div className="their-answer-wrap">
                {theirAnswers[i]
                  ? <div className="their-answer">{theirAnswers[i]}</div>
                  : <div className="their-answer empty">Waiting for {theirName}…</div>
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="navfoot">
        <span />
        <button className="btn-solid" onClick={onNext}>Next: score the load →</button>
      </div>
    </>
  );
}
