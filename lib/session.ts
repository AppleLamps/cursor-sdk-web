export interface SessionState {
  sessionId: string;
  agentId?: string;
}

const STORAGE_KEY = "cursor-sdk-web-session";

export function loadSession(): SessionState {
  if (typeof window === "undefined") {
    return { sessionId: crypto.randomUUID() };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as SessionState;
    }
  } catch {
    // ignore corrupt storage
  }

  const session: SessionState = { sessionId: crypto.randomUUID() };
  saveSession(session);
  return session;
}

export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function resetSession(): SessionState {
  const session: SessionState = { sessionId: crypto.randomUUID() };
  saveSession(session);
  return session;
}
