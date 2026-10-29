// Minimal external store over localStorage. Components subscribe with
// useAppData(); all writes go through update() (see lib/data-service.ts).
import { useSyncExternalStore } from "react";
import type { AppData } from "./types";
import { DATA_VERSION, buildSeedData } from "./mock-data";
import { STORAGE_KEY, readJSON, removeKey, writeJSON } from "./storage";

let state: AppData | null = null;
let serverState: AppData | null = null;
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function isValid(d: unknown): d is AppData {
  const x = d as AppData | null;
  return !!x && x.version === DATA_VERSION && Array.isArray(x.clients) && Array.isArray(x.applications);
}

function load(): AppData {
  const saved = readJSON<AppData>(STORAGE_KEY);
  if (isValid(saved)) return saved;
  const seed = buildSeedData();
  writeJSON(STORAGE_KEY, seed);
  return seed;
}

export function getState(): AppData {
  if (typeof window === "undefined") {
    if (!serverState) serverState = buildSeedData();
    return serverState;
  }
  if (!state) state = load();
  return state;
}

function emit() {
  for (const l of listeners) l();
}

function persistSoon() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (state) writeJSON(STORAGE_KEY, state);
  }, 250);
}

/** Apply a mutation to a cloned copy of state, then persist and notify. */
export function update(recipe: (draft: AppData) => void): AppData {
  const next = structuredClone(getState());
  recipe(next);
  state = next;
  persistSoon();
  emit();
  return next;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState(): AppData {
  removeKey(STORAGE_KEY);
  state = buildSeedData();
  writeJSON(STORAGE_KEY, state);
  emit();
  return state;
}

// Keep multiple tabs in sync during a demo.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const saved = readJSON<AppData>(STORAGE_KEY);
    if (isValid(saved)) {
      state = saved;
      emit();
    }
  });
  window.addEventListener("beforeunload", () => {
    if (persistTimer && state) writeJSON(STORAGE_KEY, state);
  });
}

/** Full app data; stable reference until the next update. */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getState, getState);
}

const noopSubscribe = () => () => {};
/** False during SSR and hydration, true once mounted on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
