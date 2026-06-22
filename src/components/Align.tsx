import { ALIGN_QUESTIONS } from '../constants';
import type { AppState } from '../types';

interface Props {
  align: AppState['align'];
  onChange: (align: AppState['align']) => void;
  onNext: () => void;
}

export default function Align({ align, onChange, onNext }: Props) {
  function update(i: number, side: 'you' | 'partner', value: string) {
    const next = align.map((entry, idx) =>
      idx === i ? { ...entry, [side]: value } : entry
    );
    onChange(next);
  }

  return (
    <>
      <div className="card">
        <h2 className="sec">Align first</h2>
        <p className="lead">
          Answer these separately, then read each other's. Most household friction
          isn't about who does the dishes — it's that "clean enough" and "what bugs
          me" are different for each of you, and never got said out loud. The goal
          here isn't agreement yet. It's an honest map of where you already agree
          and where you don't.
        </p>
        <div className="align-note">
          Tip: fill your own column without looking at the other. Compare after.
          Mismatches aren't problems — they're the conversation.
        </div>
        <div className="qhead">
          <div className="you-label">You</div>
          <div className="partner-label">Partner</div>
        </div>

        {ALIGN_QUESTIONS.map((q, i) => (
          <div key={i} className="qblock">
            <div className="qtext">{i + 1}. {q}</div>
            <div className="qpair">
              <textarea
                className="you-ta"
                placeholder="You…"
                value={align[i]?.you ?? ''}
                onChange={e => update(i, 'you', e.target.value)}
                aria-label={`You: ${q}`}
              />
              <textarea
                className="partner-ta"
                placeholder="Partner…"
                value={align[i]?.partner ?? ''}
                onChange={e => update(i, 'partner', e.target.value)}
                aria-label={`Partner: ${q}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="navfoot">
        <span />
        <button className="btn-solid" onClick={onNext}>
          Next: score the load →
        </button>
      </div>
    </>
  );
}
