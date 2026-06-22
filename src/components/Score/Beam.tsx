import type { ScoreSummary } from '../../scoring';

interface Props {
  summary: ScoreSummary;
}

export default function Beam({ summary }: Props) {
  const { me, partner, beamAngleDeg } = summary;

  // Pans bob up/down proportional to beam tilt (matching mockup: deg * 1.3px)
  const panLTranslate = beamAngleDeg * 1.3;
  const panRTranslate = -beamAngleDeg * 1.3;

  const total = me.loadPoints + partner.loadPoints;
  const gap = Math.abs(me.sharePercent - partner.sharePercent);
  const heavier = me.loadPoints >= partner.loadPoints ? 'you' : 'your partner';

  return (
    <div className="scale">
      <div className="beamwrap" aria-label="Balance beam showing load distribution">
        <div className="pan left" style={{ transform: `translateY(${panLTranslate}px)` }}>
          <div className="who">You</div>
          <div className="big">{Math.round(me.sharePercent)}%</div>
          <div className="pts">
            {Math.round(me.loadPoints)} pts · {(me.monthlyMinutes / 60).toFixed(1)} h/mo
          </div>
        </div>

        <div className="pan right" style={{ transform: `translateY(${panRTranslate}px)` }}>
          <div className="who">Partner</div>
          <div className="big">{Math.round(partner.sharePercent)}%</div>
          <div className="pts">
            {Math.round(partner.loadPoints)} pts · {(partner.monthlyMinutes / 60).toFixed(1)} h/mo
          </div>
        </div>

        <div className="beam" style={{ transform: `rotate(${beamAngleDeg}deg)` }} />
        <div className="beam-post" />
        <div className="fulcrum" />
      </div>

      <div className="verdict">
        {total === 0
          ? 'Nothing assigned yet — tag tasks below.'
          : gap < 6
          ? <><b>Balanced.</b> Within a few points of even.</>
          : <><b>{Math.round(gap)} points apart</b> — tilted toward {heavier}.</>
        }
      </div>

      <div className="legend">
        <span><i className="dot" style={{ background: 'var(--you)' }} />You</span>
        <span><i className="dot" style={{ background: 'var(--partner)' }} />Partner</span>
        <span><i className="dot" style={{ background: 'var(--both)' }} />Both (50/50)</span>
        <span><i className="dot" style={{ background: 'var(--hk)' }} />Outsource</span>
        <span><i className="dot" style={{ background: 'var(--na)' }} />N/A</span>
      </div>
    </div>
  );
}
