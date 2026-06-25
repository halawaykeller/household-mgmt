import { useState } from 'react';
import type { Seat } from '../types';

const DONE_KEY = 'wizard-done';

export function wizardDone() {
  localStorage.setItem(DONE_KEY, '1');
}
export function shouldShowWizard() {
  return localStorage.getItem(DONE_KEY) !== '1';
}

interface Props {
  name: string;
  partnerName: string;  // '' if partner hasn't joined yet
  seat: Seat;
  onDone: () => void;
}

const TOTAL_STEPS = 5;

export default function OnboardingWizard({ name, partnerName, seat, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  function go(n: number) {
    setDirection(n > step ? 'forward' : 'back');
    setStep(n);
  }

  function finish() {
    wizardDone();
    onDone();
  }

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="wizard-backdrop" onClick={e => { if (e.target === e.currentTarget) finish(); }}>
      <div className="wizard-modal" role="dialog" aria-modal="true" aria-label="Getting started">

        {/* Progress dots */}
        <div className="wizard-dots" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              className={`wizard-dot${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Step content — key forces re-mount so CSS animation fires */}
        <div key={`${step}-${direction}`} className={`wizard-step wizard-step-${direction}`}>
          {step === 0 && <StepWelcome name={name} partnerName={partnerName} seat={seat} />}
          {step === 1 && <StepPhases />}
          {step === 2 && <StepScoring />}
          {step === 3 && <StepAsync seat={seat} partnerName={partnerName} />}
          {step === 4 && <StepReady name={name} partnerName={partnerName} seat={seat} />}
        </div>

        {/* Navigation */}
        <div className="wizard-nav">
          <button className="wizard-skip" onClick={finish}>Skip intro</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button className="btn-ghost" onClick={() => go(step - 1)}>← Back</button>
            )}
            {isLast
              ? <button className="btn-solid" onClick={finish}>Start Phase 1 →</button>
              : <button className="btn-solid" onClick={() => go(step + 1)}>Next →</button>
            }
          </div>
        </div>

      </div>
    </div>
  );
}

// ---- Individual steps ----

function StepWelcome({ name, partnerName, seat }: { name: string; partnerName: string; seat: Seat }) {
  return (
    <div>
      <div className="wizard-eyebrow">Welcome</div>
      <h2 className="wizard-heading">Hi {name}.</h2>
      <p className="wizard-body">
        <strong>Align · Score · Decide</strong> is a facilitation tool — not a chore tracker.
        It runs one structured conversation in three phases, in order.
      </p>
      <p className="wizard-body">
        The goal isn't to log who did the dishes. It's to have the conversation
        you haven't had yet: what does "fair" actually mean to each of you?
      </p>
      {seat === 'a' && !partnerName && (
        <div className="wizard-callout">
          Your partner hasn't joined yet. Share the link from the top of the page
          so they can fill out their own view.
        </div>
      )}
      {seat === 'b' && partnerName && (
        <div className="wizard-callout">
          {partnerName} has already started. You'll each fill in your own answers
          and then compare.
        </div>
      )}
    </div>
  );
}

function StepPhases() {
  return (
    <div>
      <div className="wizard-eyebrow">How it works</div>
      <h2 className="wizard-heading">Three phases, in order.</h2>
      <p className="wizard-body">
        Jumping to tactics before you've aligned is where most of these conversations break down.
      </p>
      <div className="wizard-phase-grid">
        <div className="wizard-phase-card" style={{ borderLeft: '3px solid var(--you)' }}>
          <div className="wizard-phase-label">Phase 1</div>
          <div className="wizard-phase-name">Align</div>
          <div className="wizard-phase-desc">
            Surface what each of you values and hates — before you touch the schedule.
            Mismatches here are the real conversation.
          </div>
        </div>
        <div className="wizard-phase-card" style={{ borderLeft: '3px solid var(--both)' }}>
          <div className="wizard-phase-label">Phase 2</div>
          <div className="wizard-phase-name">Score the load</div>
          <div className="wizard-phase-desc">
            Inventory every task, weigh it for time and hidden effort, assign it,
            and watch a balance beam show whether the split is fair.
          </div>
        </div>
        <div className="wizard-phase-card" style={{ borderLeft: '3px solid var(--partner)' }}>
          <div className="wizard-phase-label">Phase 3</div>
          <div className="wizard-phase-name">Decide</div>
          <div className="wizard-phase-desc">
            Pick solutions — housekeeper, schedule, heuristics, or a mix.
            Set a budget. Write the actual plan, including the sick-day contingency.
          </div>
        </div>
      </div>
    </div>
  );
}

function StepScoring() {
  return (
    <div>
      <div className="wizard-eyebrow">Phase 2 — Score</div>
      <h2 className="wizard-heading">The score isn't just minutes.</h2>
      <p className="wizard-body">
        Raw time undercounts the work nobody sees. Each task gets two
        hidden-effort multipliers on top of its time:
      </p>

      <div className="wizard-score-factors">
        <div className="wizard-factor">
          <div className="wizard-factor-badge">Mental load  0–3</div>
          <div className="wizard-factor-desc">
            Ongoing noticing, planning, and remembering. Meal planning is a 3.
            Unloading the dishwasher is a 0.
          </div>
        </div>
        <div className="wizard-factor">
          <div className="wizard-factor-badge">Ick factor  0–2</div>
          <div className="wizard-factor-desc">
            The "nobody wants this" tax. Cleaning the toilet is a 2.
            Watering the plants is a 0.
          </div>
        </div>
      </div>

      <div className="wizard-formula">
        <span className="wf-part">minutes × freq</span>
        <span className="wf-op">×</span>
        <span className="wf-part">mental multiplier</span>
        <span className="wf-op">×</span>
        <span className="wf-part">ick multiplier</span>
        <span className="wf-op">=</span>
        <span className="wf-result">load points</span>
      </div>

      <p className="wizard-body" style={{ marginTop: 14 }}>
        A balance beam shows your split in real time. You can dial the
        weights up or down to match what matters to you.
      </p>
    </div>
  );
}

function StepAsync({ seat, partnerName }: { seat: Seat; partnerName: string }) {
  const other = partnerName || 'your partner';
  return (
    <div>
      <div className="wizard-eyebrow">How to use it together</div>
      <h2 className="wizard-heading">Fill it out separately. Compare after.</h2>
      <p className="wizard-body">
        Each person opens the same link on their own device and fills in
        their own view — independently, without peeking.
      </p>

      <div className="wizard-async-diagram">
        <div className={`wizard-device${seat === 'a' ? ' wizard-device-you' : ''}`}>
          <div className="wizard-device-label">You</div>
          <div className="wizard-device-screen">
            <div className="wds-row you-row">Dishes → me</div>
            <div className="wds-row you-row">Cooking → partner</div>
            <div className="wds-row you-row">Laundry → both</div>
          </div>
        </div>
        <div className="wizard-async-arrow">→</div>
        <div className="wizard-device wizard-device-compare">
          <div className="wizard-device-label">Compare</div>
          <div className="wizard-device-screen">
            <div className="wds-row agree-row">✓ Dishes</div>
            <div className="wds-row disagree-row">! Cooking</div>
            <div className="wds-row agree-row">✓ Laundry</div>
          </div>
        </div>
        <div className="wizard-async-arrow">←</div>
        <div className={`wizard-device${seat === 'b' ? ' wizard-device-you' : ''}`}>
          <div className="wizard-device-label">{other}</div>
          <div className="wizard-device-screen">
            <div className="wds-row partner-row">Dishes → me</div>
            <div className="wds-row partner-row">Cooking → me</div>
            <div className="wds-row partner-row">Laundry → both</div>
          </div>
        </div>
      </div>

      <p className="wizard-body">
        The Compare view shows where you agree (✓) and where you don't (!).
        Those disagreements — not the chore list — are the real conversation.
      </p>
    </div>
  );
}

function StepReady({ name, partnerName, seat }: { name: string; partnerName: string; seat: Seat }) {
  const other = partnerName || 'your partner';
  return (
    <div>
      <div className="wizard-eyebrow">You're all set</div>
      <h2 className="wizard-heading">Start with Phase 1 — Align.</h2>
      <p className="wizard-body">
        Six questions. Fill in <em>your</em> column without looking at {other}'s.
        The tip at the top of the page says the same thing — we mean it.
      </p>
      <p className="wizard-body">
        Take your time. Come back to it. The session auto-saves every few seconds
        and both of you can see updates in real time.
      </p>
      {seat === 'a' && !partnerName && (
        <div className="wizard-callout">
          Share the link at the top of the page with {other} before you start,
          so you can both fill it out at your own pace.
        </div>
      )}
      {seat === 'b' && (
        <div className="wizard-callout">
          {partnerName ? partnerName : 'Your partner'} may already be filling
          in their column. You won't see their answers until you compare.
        </div>
      )}
      <p className="wizard-muted">
        Clippy will check in occasionally. You can dismiss them at any time
        or click the 📎 in the corner to bring them back.
      </p>
    </div>
  );
}
