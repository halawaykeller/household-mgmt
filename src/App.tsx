import { useEffect, useRef, useState, useCallback } from 'react';
import type { AppState, Seat } from './types';
import { makeFreshState, migrateState } from './constants';
import { createSession, fetchSession, saveSession } from './api';
import IdentityGate from './components/IdentityGate';
import PhaseNav from './components/PhaseNav';
import Align from './components/Align';
import Score from './components/Score';
import Decide from './components/Decide';
import Clippy from './components/Clippy';
import OnboardingWizard, { shouldShowWizard } from './components/OnboardingWizard';

const SESSION_KEY = 'household-session-id';
// Maps sessionId → seat ('a' | 'b') so each device remembers who it is.
const SEAT_KEY = (id: string) => `household-seat-${id}`;

type LoadStatus = 'loading' | 'ready' | 'error';

function getSessionIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('s');
}

function setSessionIdInUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('s', id);
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seat, setSeat] = useState<Seat | null>(null);
  const [state, setStateRaw] = useState<AppState>(makeFreshState());
  const [copied, setCopied] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const urlId = getSessionIdFromUrl();
        const storedId = localStorage.getItem(SESSION_KEY);
        const id = urlId ?? storedId;

        let session;
        if (id) {
          try { session = await fetchSession(id); }
          catch { session = await createSession(makeFreshState()); }
        } else {
          session = await createSession(makeFreshState());
        }

        const migratedState = migrateState(session.state as unknown as Record<string, unknown>);

        localStorage.setItem(SESSION_KEY, session.id);
        setSessionIdInUrl(session.id);
        setSessionId(session.id);
        setStateRaw(migratedState);

        // Restore seat from localStorage if this device has been here before
        const savedSeat = localStorage.getItem(SEAT_KEY(session.id)) as Seat | null;
        if (savedSeat) setSeat(savedSeat);

        setStatus('ready');
      } catch (e) {
        console.error('Failed to initialize session', e);
        setStatus('error');
      }
    }
    void init();
  }, []);

  const setState = useCallback(
    (updater: AppState | ((prev: AppState) => AppState)) => {
      setStateRaw(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (sessionId) void saveSession(sessionId, next);
        }, 500);
        return next;
      });
    },
    [sessionId]
  );

  function claimSeat(claimedSeat: Seat, name: string) {
    if (!sessionId) return;
    localStorage.setItem(SEAT_KEY(sessionId), claimedSeat);
    setSeat(claimedSeat);
    setState(s => ({ ...s, [claimedSeat]: { ...s[claimedSeat], name } }));
    // Show the onboarding wizard the first time a seat is claimed on this device
    if (shouldShowWizard()) setShowWizard(true);
  }

  function copyShareLink() {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === 'loading') {
    return <div className="wrap"><div className="loading-screen">Loading your session…</div></div>;
  }
  if (status === 'error') {
    return (
      <div className="wrap">
        <div className="error-screen">
          <p>Couldn't connect to the server.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Show identity gate until this device has claimed a seat
  if (!seat) {
    return <IdentityGate state={state} onClaim={claimSeat} />;
  }

  const myName     = state[seat].name;
  const theirSeat: Seat = seat === 'a' ? 'b' : 'a';
  const theirName  = state[theirSeat].name || 'Partner';

  return (
    <div className="wrap">
      <div className="eyebrow">Household conversation tool</div>
      <h1>Align · Score · Decide</h1>
      <p className="sub">
        Three phases, in order. Talk about what matters before you touch the
        schedule — then score the real load, then choose how to split it.
        Everything saves as you go.
      </p>

      <div className="session-bar">
        <span>Share with {theirName === 'Partner' ? 'your partner' : theirName}:</span>
        <span className="share-url">{window.location.href}</span>
        <button onClick={copyShareLink} className={copied ? 'copied' : ''}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <span className="session-who">You are <strong>{myName}</strong></span>
      </div>

      <PhaseNav
        current={state.screen}
        onChange={screen => setState(s => ({ ...s, screen }))}
      />

      {state.screen === 'align' && (
        <Align
          seat={seat}
          myName={myName}
          theirName={theirName}
          myAnswers={state[seat].alignAnswers}
          theirAnswers={state[theirSeat].alignAnswers}
          onChange={alignAnswers => setState(s => ({ ...s, [seat]: { ...s[seat], alignAnswers } }))}
          onNext={() => setState(s => ({ ...s, screen: 'score' }))}
        />
      )}

      {state.screen === 'score' && (
        <Score
          seat={seat}
          myName={myName}
          theirName={theirName}
          state={state}
          onChange={setState}
          onBack={() => setState(s => ({ ...s, screen: 'align' }))}
          onNext={() => setState(s => ({ ...s, screen: 'decide' }))}
        />
      )}

      {state.screen === 'decide' && (
        <Decide
          myName={myName}
          theirName={theirName}
          state={state}
          onChange={setState}
          onBack={() => setState(s => ({ ...s, screen: 'score' }))}
          onReset={() => {
            if (window.confirm('Reset everything? This will clear all entries.')) {
              setState(makeFreshState());
              if (sessionId) localStorage.removeItem(SEAT_KEY(sessionId));
              setSeat(null);
            }
          }}
        />
      )}
      {showWizard && (
        <OnboardingWizard
          name={myName}
          partnerName={theirName === 'Partner' ? '' : theirName}
          seat={seat}
          onDone={() => setShowWizard(false)}
        />
      )}
      <Clippy screen={state.screen} state={state} seat={seat} />
    </div>
  );
}
