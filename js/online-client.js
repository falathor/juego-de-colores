import { ONLINE_API } from './online-config.js';
import { validCode } from './online-game.js';

const KEY = 'de-que-color.online.v1';
export class OnlineClient {
  constructor({ onState, onNotice, endpoint = ONLINE_API, store, fetcher = fetch, interval = 2000 }) {
    this.endpoint = endpoint.replace(/\/$/, ''); this.onState = onState; this.onNotice = onNotice;
    this.fetcher = (...args) => fetcher(...args); this.interval = interval; this.store = store; this.session = null;
    this.state = null; this.generation = 0; this.timer = null; this.pending = false; this.failures = 0;
    try {
      this.store ??= globalThis.localStorage;
      const saved = JSON.parse(this.store?.getItem(KEY) || 'null');
      if (saved && saved.endpoint === this.endpoint && validCode(saved.code) && /^[a-f0-9]{64}$/.test(saved.token)) this.session = saved;
    } catch { this.onNotice('Este navegador no permite guardar la sesión. Mantén abierta esta página.'); }
  }
  save() {
    try { if (this.session) this.store?.setItem(KEY, JSON.stringify(this.session)); else this.store?.removeItem(KEY); }
    catch { this.onNotice('No se pudo guardar la sesión. Mantén abierta esta página para poder volver.'); }
  }
  async request(path, input, secret) {
    if (!this.endpoint) throw new Error('El servicio de partidas aún no está configurado.');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await this.fetcher(`${this.endpoint}${path}`, { method: input === undefined ? 'GET' : 'POST',
        headers: { ...(input === undefined ? {} : { 'Content-Type': 'application/json' }), ...(secret ? { Authorization: `Bearer ${secret}` } : {}) },
        ...(input === undefined ? {} : { body: JSON.stringify(input) }), signal: controller.signal, credentials: 'omit', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || 'No se pudo completar la petición.');
        error.terminal = ['El anfitrión ha cerrado la sala.', 'La sala no existe o ha caducado.'].includes(data.error);
        throw error;
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError || error.name === 'AbortError') throw new Error('Sin conexión con la sala. Comprueba la red; tu sesión sigue guardada.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  pause() { this.generation++; clearTimeout(this.timer); this.timer = null; }
  clear() { this.pause(); this.session = null; this.state = null; this.save(); }
  async enter(code, name, config) {
    this.pause(); const generation = this.generation;
    const data = await this.request(code ? `/rooms/${code}/join` : '/rooms', { name, ...(config ? { config } : {}) });
    if (generation !== this.generation) return;
    this.session = { endpoint: this.endpoint, code: data.state.code, token: data.token }; this.save();
    this.accept(data); this.schedule(generation);
  }
  accept(data) {
    if (data.closed || data.left) { this.clear(); this.onState(null); return; }
    if (this.state && data.state.code === this.state.code && data.state.myId === this.state.myId && data.state.revision < this.state.revision) return;
    this.state = data.state; this.failures = 0; this.onState(this.state);
  }
  schedule(generation) {
    clearTimeout(this.timer);
    if (this.session && generation === this.generation) this.timer = setTimeout(() => this.refresh(generation), Math.min(10000, this.interval * (1 + this.failures)));
  }
  async resume() { if (this.session) { this.pause(); await this.refresh(this.generation); } }
  async refresh(generation = this.generation) {
    if (!this.session || generation !== this.generation) return;
    if (this.pending) { this.schedule(generation); return; }
    try {
      const data = await this.request(`/rooms/${this.session.code}`, undefined, this.session.token);
      if (generation !== this.generation || this.pending) return;
      const recovered = this.failures > 0;
      this.accept(data);
      if (recovered) this.onNotice('Conexión recuperada.');
    } catch (error) {
      if (generation === this.generation && error.terminal) { this.clear(); this.onState(null); this.onNotice(error.message); return; }
      if (generation === this.generation) { this.failures++; if (this.failures === 1) this.onNotice(error.message); }
    } finally { this.schedule(generation); }
  }
  async action(action, extra = {}) {
    if (!this.session || this.pending) return;
    this.pending = true; const generation = this.generation;
    clearTimeout(this.timer);
    try {
      const data = await this.request(`/rooms/${this.session.code}/action`, { action, round: this.state?.round, ...extra }, this.session.token);
      if (generation === this.generation) this.accept(data);
    } catch (error) {
      if (generation === this.generation && error.terminal) { this.clear(); this.onState(null); }
      throw error;
    } finally { this.pending = false; this.schedule(generation); }
  }
}
