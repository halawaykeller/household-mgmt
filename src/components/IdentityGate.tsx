import { useState } from 'react';
import type { AppState, Seat } from '../types';

interface Props {
  state: AppState;
  onClaim: (seat: Seat, name: string) => void;
}

// Shown when we don't know which person is sitting at this device.
// Seat A is claimed first; seat B is claimed when the partner opens the shared link.
// Once both are taken, we show both names and ask which one you are.
export default function IdentityGate({ state, onClaim }: Props) {
  const [name, setName] = useState('');

  const aName = state.a.name;
  const bName = state.b.name;
  const aOpen = !aName;
  const bOpen = !bName;

  // Both seats taken — ask which one you are
  if (!aOpen && !bOpen) {
    return (
      <div className="identity-gate">
        <div className="identity-card">
          <h2>Welcome back — which one are you?</h2>
          <div className="identity-buttons">
            <button className="btn-solid" onClick={() => onClaim('a', aName)}>{aName}</button>
            <button className="btn-solid" onClick={() => onClaim('b', bName)}>{bName}</button>
          </div>
        </div>
      </div>
    );
  }

  const claimingSeat: Seat = aOpen ? 'a' : 'b';

  return (
    <div className="identity-gate">
      <div className="identity-card">
        <div className="eyebrow">Household conversation tool</div>
        <h1>Align · Score · Decide</h1>

        {!aOpen && (
          <p className="identity-sub">
            <strong>{aName}</strong> is already here. You must be their partner.
          </p>
        )}
        {aOpen && (
          <p className="identity-sub">
            You're the first one here. Share this page's URL with your partner
            so they can join on their own device.
          </p>
        )}

        <label htmlFor="identity-name" className="identity-label">
          What's your name?
        </label>
        <input
          id="identity-name"
          type="text"
          className="identity-input"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onClaim(claimingSeat, name.trim()); }}
          autoFocus
        />
        <button
          className="btn-solid"
          style={{ marginTop: 12, width: '100%' }}
          disabled={!name.trim()}
          onClick={() => onClaim(claimingSeat, name.trim())}
        >
          Start →
        </button>
      </div>
    </div>
  );
}
