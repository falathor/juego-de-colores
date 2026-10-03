import { restoreGame } from './game.js';

export const GAME_KEY = 'de-que-color.partida.v1';
export const HISTORY_KEY = 'de-que-color.historial.v1';
export function createStorage(provider = () => globalThis.localStorage, onWarning = () => {}) {
  const memory = new Map();
  let volatile = false;
  function warn() {
    if (!volatile) onWarning('No se puede guardar en este navegador. La partida continuará mientras no cierres la página.');
    volatile = true;
  }
  function read(key) {
    if (memory.has(key)) return memory.get(key);
    if (volatile) return null;
    try { const raw = provider().getItem(key); memory.set(key, raw); return raw; }
    catch { warn(); return null; }
  }
  function write(key, raw) {
    memory.set(key, raw);
    if (volatile) return;
    try { raw === null ? provider().removeItem(key) : provider().setItem(key, raw); }
    catch { warn(); }
  }
  return {
    loadGame() {
      const raw = read(GAME_KEY);
      if (!raw) return { game: null, corrupt: false };
      try { return { game: restoreGame(JSON.parse(raw)), corrupt: false }; }
      catch { return { game: null, corrupt: true }; }
    },
    saveGame(game) { write(GAME_KEY, JSON.stringify(game)); },
    clearGame() { write(GAME_KEY, null); },
    history() {
      try {
        const value = JSON.parse(read(HISTORY_KEY) || '[]');
        return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string'))] : [];
      } catch { return []; }
    },
    markSeen(id) { write(HISTORY_KEY, JSON.stringify([...new Set([...this.history(), id])])); },
    clearHistory() { write(HISTORY_KEY, null); },
    get volatile() { return volatile; },
  };
}
