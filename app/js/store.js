// Progress store: everything lives in localStorage under one key. Nothing is sent anywhere.

const KEY = 'vice-platinum-v1';

const blank = () => ({ earned: {}, counts: {}, notes: {}, settings: { spoilers: true } });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    return {
      earned: s.earned || {},
      counts: s.counts || {},
      notes: s.notes || {},
      settings: { spoilers: true, ...(s.settings || {}) },
    };
  } catch {
    return blank();
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function exportJSON(state) {
  return JSON.stringify({ app: 'vice-platinum', version: 1, exported: new Date().toISOString(), ...state }, null, 1);
}

export function importJSON(text) {
  const s = JSON.parse(text);
  if (typeof s !== 'object' || s === null) throw new Error('not a progress file');
  return {
    earned: s.earned || {},
    counts: s.counts || {},
    notes: s.notes || {},
    settings: { spoilers: true, ...(s.settings || {}) },
  };
}

export function reset() {
  localStorage.removeItem(KEY);
  return blank();
}
