export const SAVE_KEY = 'rugby-carriere-v1';

const storageOrNull = (s) => s ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined);

export function save(state, storage) {
  try { storageOrNull(storage).setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function load(storage) {
  try {
    const st = storage === undefined ? storageOrNull(undefined) : storage;
    if (!st) return null;
    const raw = st.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !s.player || typeof s.rngState !== 'number') return null;
    return s;
  } catch { return null; }
}

export function clearSave(storage) {
  try { storageOrNull(storage).removeItem(SAVE_KEY); } catch { /* rien */ }
}
