"""
FastAPI backend for Household Align · Score · Decide.

Three endpoints only:
  POST /api/sessions        — create a new session, return {id, state}
  GET  /api/sessions/{id}   — fetch session state
  PUT  /api/sessions/{id}   — replace session state

State is stored as a JSONB blob in Postgres. One row per household session.
Mangum wraps FastAPI so it runs as a Vercel serverless function.
"""

import json
import os
import uuid
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Household ASD API", docs_url="/api/docs")

# Allow the Vite dev server and any Vercel deploy to talk to the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)


@contextmanager
def get_db():
    """Open a database connection for one request, then close it."""
    conn = psycopg2.connect(
        os.environ["POSTGRES_URL"],
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


class StatePayload(BaseModel):
    state: dict  # full AppState blob from the frontend


@app.post("/api/sessions", status_code=201)
def create_session(payload: StatePayload):
    """Create a new session with the provided initial state."""
    session_id = str(uuid.uuid4())
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (id, state) VALUES (%s, %s)",
                (session_id, json.dumps(payload.state)),
            )
    return {"id": session_id, "state": payload.state}


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    """Fetch the current state for a session."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT state FROM sessions WHERE id = %s", (session_id,))
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session_id, "state": row["state"]}


@app.put("/api/sessions/{session_id}")
def update_session(session_id: str, payload: StatePayload):
    """Replace the full state for a session. Returns the updated state."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sessions
                SET state = %s, updated_at = now()
                WHERE id = %s
                """,
                (json.dumps(payload.state), session_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session_id, "state": payload.state}


# Vercel invokes this as the serverless handler
handler = Mangum(app, lifespan="off")
