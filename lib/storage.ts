// Error-safe localStorage helpers. Every access is guarded so private windows,
// disabled storage, or quota errors never crash the demo.

export const STORAGE_KEY = "grantos_demo_v1";
export const SESSION_KEY = "grantos_demo_session";

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function readJSON<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ---- demo session (fake auth) ------------------------------------------------

export interface DemoSession {
  demoSession: true;
  email: string;
  signedInAt: string;
}

export function getSession(): DemoSession | null {
  const s = readJSON<DemoSession>(SESSION_KEY);
  return s?.demoSession ? s : null;
}

export function setSession(email: string): void {
  writeJSON(SESSION_KEY, { demoSession: true, email, signedInAt: new Date().toISOString() });
}

export function clearSession(): void {
  removeKey(SESSION_KEY);
}
