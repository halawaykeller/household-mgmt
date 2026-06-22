import type { AppState } from '../types';

interface Props {
  current: AppState['screen'];
  onChange: (screen: AppState['screen']) => void;
}

const PHASES: { id: AppState['screen']; num: string; title: string; desc: string }[] = [
  { id: 'align',  num: 'Phase 1', title: 'Align',          desc: "What's important to each of us" },
  { id: 'score',  num: 'Phase 2', title: 'Score the load', desc: 'What the work actually weighs' },
  { id: 'decide', num: 'Phase 3', title: 'Decide',         desc: 'How we split & what we pay to offload' },
];

export default function PhaseNav({ current, onChange }: Props) {
  return (
    <nav className="phasenav" aria-label="Phases">
      {PHASES.map(p => (
        <button
          key={p.id}
          className={`phase${current === p.id ? ' on' : ''}`}
          onClick={() => onChange(p.id)}
          aria-current={current === p.id ? 'step' : undefined}
        >
          <div className="pn">{p.num}</div>
          <div className="pt">{p.title}</div>
          <div className="pd">{p.desc}</div>
        </button>
      ))}
    </nav>
  );
}
