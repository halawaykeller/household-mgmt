import { useEffect, useRef, useState, useCallback } from 'react';
import type { AppState } from './types';
import { makeFreshState } from './constants';
import { createSession, fetchSession, saveSession } from './api';
import PhaseNav from './components/PhaseNav';
import Align from './components/Align';
import Score from './components/Score';
import Decide from './components/Decide';

const SESSION_KEY = 'household-session-id';

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
  const [state, setStateRaw] = useState<AppState>(makeFreshState());
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load or create session on mount
  useEffect(() => {
    async function init() {
      try {
        const urlId = getSessionIdFromUrl();
        const storedId = localStorage.getItem(SESSION_KEY);
        const id = urlId ?? storedId;

        let session;
        if (id) {
          try {
            session = await fetchSession(id);
          } catch {
            // Session not found (deleted or wrong id) — start fresh
            session = await createSession(makeFreshState());
          }
        } else {
          session = await createSession(makeFreshState());
        }

        localStorage.setItem(SESSION_KEY, session.id);
        setSessionIdInUrl(session.id);
        setSessionId(session.id);
        setStateRaw(session.state);
        setStatus('ready');
      } catch (e) {
        console.error('Failed to initialize session', e);
        setStatus('error');
      }
    }
    void init();
  }, []);

  // Debounced autosave: 500ms after the last state change
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

  function copyShareLink() {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === 'loading') {
    return (
      <div className="wrap">
        <div className="loading-screen">Loading your session…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="wrap">
        <div className="error-screen">
          <p>Couldn't connect to the server. Is the API running?</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

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
        <span>Share this link with your partner:</span>
        <span className="share-url">{window.location.href}</span>
        <button onClick={copyShareLink} className={copied ? 'copied' : ''}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <PhaseNav
        current={state.screen}
        onChange={screen => setState(s => ({ ...s, screen }))}
      />

      {state.screen === 'align' && (
        <Align
          align={state.align}
          onChange={align => setState(s => ({ ...s, align }))}
          onNext={() => setState(s => ({ ...s, screen: 'score' }))}
        />
      )}

      {state.screen === 'score' && (
        <Score
          state={state}
          onChange={setState}
          onBack={() => setState(s => ({ ...s, screen: 'align' }))}
          onNext={() => setState(s => ({ ...s, screen: 'decide' }))}
        />
      )}

      {state.screen === 'decide' && (
        <Decide
          state={state}
          onChange={setState}
          onBack={() => setState(s => ({ ...s, screen: 'score' }))}
          onReset={() => {
            if (window.confirm('Reset everything? This will clear all entries.')) {
              setState(makeFreshState());
            }
          }}
        />
      )}
    </div>
  );
}
