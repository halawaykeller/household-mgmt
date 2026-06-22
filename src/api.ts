// Thin fetch wrapper for the three session API endpoints.
// All requests go to /api/sessions, proxied to the Python backend in dev
// and handled by Vercel serverless in production.

import type { AppState, Session } from './types';

const BASE = '/api/sessions';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function createSession(state: AppState): Promise<Session> {
  return request<Session>(BASE, {
    method: 'POST',
    body: JSON.stringify({ state }),
  });
}

export function fetchSession(id: string): Promise<Session> {
  return request<Session>(`${BASE}/${id}`);
}

export function saveSession(id: string, state: AppState): Promise<Session> {
  return request<Session>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ state }),
  });
}
