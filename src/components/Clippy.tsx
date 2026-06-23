import { useEffect, useState } from 'react';
import type { AppState, Seat } from '../types';
import { summarize } from '../scoring';

const GONE_KEY = 'clippy-gone';   // set to '1' when permanently dismissed
const SEEN_KEY = 'clippy-seen';   // JSON array of seen message IDs

interface Message {
  id: string;
  screen: AppState['screen'] | '*';
  text: string;
  condition?: (s: AppState) => boolean;
}

// Messages fire once each, in order, when their screen is active and
// their condition (if any) is met.
const MESSAGES: Message[] = [
  {
    id: 'welcome',
    screen: 'align',
    text: "It looks like you're trying to negotiate household labor!\n\nWould you like help with that?\n\n(I'm going to help regardless.)",
  },
  {
    id: 'align-filling',
    screen: 'align',
    text: "I see you're filling in your answers. Reminder: do YOUR column first, then compare. I have full visibility into both columns simultaneously. Just so you know.",
    condition: s => [...s.a.alignAnswers, ...s.b.alignAnswers].some(a => a.length > 15),
  },
  {
    id: 'score-intro',
    screen: 'score',
    text: "Welcome to the Score phase. This is where people discover that 'we both do about the same' is rarely mathematically accurate.",
  },
  {
    id: 'score-tilted',
    screen: 'score',
    text: "I notice the balance beam has developed an opinion. I'm not saying anything. I'm just a paperclip with eyes who notices things.",
    condition: s => {
      const a = Math.abs(summarize(s.a.tasks, s.a.weights).beamAngleDeg);
      const b = Math.abs(summarize(s.b.tasks, s.b.weights).beamAngleDeg);
      return a > 5 || b > 5;
    },
  },
  {
    id: 'decide-intro',
    screen: 'decide',
    text: "You've made it to the Decide phase! Where vague goodwill becomes a binding plan.\n\nI have assisted many households with this step. Most of those plans held up.",
  },
  {
    id: 'plan-blank',
    screen: 'decide',
    text: "I notice the 'Our plan' box is still empty. A verbal agreement is completely valid and definitely doesn't get forgotten within 48 hours.",
    condition: s => !s.plan.trim(),
  },
];

interface Props {
  screen: AppState['screen'];
  state: AppState;
  seat: Seat | null;
}

export default function Clippy({ screen, state, seat }: Props) {
  const [gone, setGone] = useState(() => localStorage.getItem(GONE_KEY) === '1');
  const [seen, setSeen] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')); }
    catch { return new Set(); }
  });
  const [msg, setMsg] = useState<Message | null>(null);
  const [wobble, setWobble] = useState(false);

  // Only look for a new message when we're not already showing one.
  // Seat must be claimed — Clippy stays quiet during the identity gate.
  useEffect(() => {
    if (gone || !seat || msg) return;

    const next = MESSAGES.find(m => {
      if (seen.has(m.id)) return false;
      if (m.screen !== '*' && m.screen !== screen) return false;
      if (m.condition && !m.condition(state)) return false;
      return true;
    });
    if (!next) return;

    const t = setTimeout(() => {
      setMsg(next);
      setWobble(true);
      setTimeout(() => setWobble(false), 700);
    }, 1400);
    return () => clearTimeout(t);
  }, [screen, state, gone, seat, msg]);

  function dismiss() {
    if (!msg) return;
    const next = new Set(seen).add(msg.id);
    setSeen(next);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    setMsg(null);
  }

  function goAway() {
    localStorage.setItem(GONE_KEY, '1');
    setGone(true);
    setMsg(null);
  }

  function comeback() {
    localStorage.removeItem(GONE_KEY);
    localStorage.removeItem(SEEN_KEY);
    setSeen(new Set());
    setGone(false);
  }

  // After "Go away" the paperclip shrinks to a tiny ghost icon in the corner.
  if (gone) {
    return (
      <button className="clippy-ghost" onClick={comeback} title="Bring back Clippy">
        📎
      </button>
    );
  }

  return (
    <div className="clippy-root">
      {msg && (
        <div className="clippy-bubble" role="dialog" aria-label="Clippy says">
          <p className="clippy-text">{msg.text}</p>
          <div className="clippy-btns">
            <button className="clippy-ok" onClick={dismiss}>Got it</button>
            <button className="clippy-bye" onClick={goAway}>Go away, Clippy</button>
          </div>
        </div>
      )}
      <div
        className={`clippy-guy${wobble ? ' clippy-wobble' : ''}`}
        onClick={dismiss}
        role="img"
        aria-label="Clippy"
        title={msg ? 'Click to dismiss' : 'Clippy is watching'}
      >
        <ClippySVG />
      </div>
    </div>
  );
}

function ClippySVG() {
  return (
    <svg width="52" height="80" viewBox="0 0 40 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Paperclip body — outer loop + inner fold-back */}
      <path
        d="M 30 11
           Q 30 3 20 3
           Q 10 3 10 11
           L 10 57
           Q 10 67 20 67
           Q 30 67 30 57
           L 30 23
           L 18 23
           L 18 61"
        stroke="#3d3d52"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eyes — white sclera with dark pupils */}
      <circle cx="14.5" cy="40" r="3.8" fill="white" stroke="#3d3d52" strokeWidth="1.2" />
      <circle cx="15.8" cy="40.6" r="1.7" fill="#3d3d52" />
      <circle cx="16.4" cy="39.9" r="0.6" fill="white" />

      <circle cx="26.5" cy="40" r="3.8" fill="white" stroke="#3d3d52" strokeWidth="1.2" />
      <circle cx="27.8" cy="40.6" r="1.7" fill="#3d3d52" />
      <circle cx="28.4" cy="39.9" r="0.6" fill="white" />

      {/* Smile */}
      <path
        d="M 16 48 Q 20.5 52.5 25 48"
        stroke="#3d3d52"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
