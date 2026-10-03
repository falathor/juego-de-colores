import catalog from '../data/questions.es.json' with { type: 'json' };
import { createRoom, joinRoom, actOnRoom, roomView, assertRoomOpen, validCode } from '../js/online-game.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2,'0')).join('');
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2,'0')).join('');
async function body(request) {
  const text = await request.text();
  if (text.length > 4096) throw new Error('La petición es demasiado grande.');
  try { return JSON.parse(text); } catch { throw new Error('La petición no es válida.'); }
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').includes(origin);
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return json({ ok: true, contentVersion: catalog.contentVersion });
    if (!allowed) return json({ error: 'Este origen no está autorizado.' }, 403);
    const cors = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let response;
    try {
      const creating = path === '/rooms' && request.method === 'POST';
      const match = /^\/rooms\/(\d{4})(?:\/(join|action))?$/.exec(path);
      if (!creating && (!match || !validCode(match[1]))) return new Response(JSON.stringify({ error: 'Ruta no disponible.' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
      const joining = match?.[2] === 'join' && request.method === 'POST';
      if (creating || joining) {
        const key = await hash(request.headers.get('CF-Connecting-IP') || 'local');
        const gate = env.ACCESS.get(env.ACCESS.idFromName('access'));
        const limited = await gate.fetch(new Request('https://internal/access', { method: 'POST', body: JSON.stringify({ key, kind: creating ? 'create' : 'join' }) }));
        if (!limited.ok) { response = limited; }
        else {
          const input = await body(request);
          const secret = token();
          const player = { id: crypto.randomUUID(), name: input?.name, authHash: await hash(secret) };
          for (let attempts = 0; attempts < (creating ? 20 : 1); attempts++) {
            const code = creating ? String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4,'0') : match[1];
            const room = env.ROOMS.get(env.ROOMS.idFromName(code));
            response = await room.fetch(new Request(`https://internal/${creating ? 'create' : 'join'}`, {
              method: 'POST', body: JSON.stringify({ code, player, config: input?.config }) }));
            if (creating && response.status === 409) continue;
            if (response.ok) response = json({ ...(await response.json()), token: secret });
            break;
          }
        }
      } else {
        const auth = request.headers.get('Authorization') || '';
        if (!/^Bearer [a-f0-9]{64}$/.test(auth)) response = json({ error: 'La sesión no es válida. Vuelve a entrar en la sala.' }, 401);
        else if (!(match[2] === 'action' && request.method === 'POST') && !(!match[2] && request.method === 'GET')) {
          response = json({ error: 'Método no permitido.' }, 405);
        } else {
          const room = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
          response = await room.fetch(new Request(`https://internal/${match[2] || 'state'}`, {
            method: request.method, headers: { 'X-Auth-Hash': await hash(auth.slice(7)) },
            ...(request.method === 'POST' ? { body: JSON.stringify(await body(request)) } : {}),
          }));
        }
      }
    } catch (error) { response = json({ error: error.message === 'La petición es demasiado grande.' || error.message === 'La petición no es válida.' ? error.message : 'No se ha podido completar la petición. Inténtalo de nuevo.' }, 400); }
    return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...cors } });
  },
};

export class ColorRoom {
  constructor(ctx) {
    this.ctx = ctx; this.room = null; this.presence = new Map(); this.rate = new Map();
    ctx.blockConcurrencyWhile(async () => { this.room = await ctx.storage.get('room') || null; });
  }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const path = new URL(request.url).pathname;
      const now = Date.now();
      try {
        let next, playerId;
        if (path === '/create') {
          if (this.room && this.room.expiresAt > now && this.room.phase !== 'closed') return json({ error: 'Código ocupado.' }, 409);
          const input = await body(request);
          next = createRoom(input.code, input.player, input.config, catalog, now);
          playerId = input.player.id;
        } else {
          assertRoomOpen(this.room, now);
          if (path === '/join') {
            const input = await body(request);
            next = joinRoom(this.room, input.player, now); playerId = input.player.id;
          } else {
            const member = this.room.players.find(p => p.authHash === request.headers.get('X-Auth-Hash'));
            if (!member) return json({ error: 'La sesión no pertenece a esta sala.' }, 401);
            playerId = member.id;
            const rate = this.rate.get(playerId);
            if (rate && rate.start + 1000 > now && rate.count >= 12) return json({ error: 'Demasiadas peticiones. Espera un momento.' }, 429);
            this.rate.set(playerId, rate && rate.start + 1000 > now ? { ...rate, count: rate.count + 1 } : { start: now, count: 1 });
            next = path === '/action' ? actOnRoom(this.room, playerId, await body(request), now) : this.room;
          }
        }
        if (next !== this.room) {
          // Assign only after the atomic write succeeds: failures leave live state unchanged.
          await this.ctx.storage.transaction(async () => {
            await this.ctx.storage.put('room', next);
            if (path === '/create') await this.ctx.storage.setAlarm(next.expiresAt);
          });
          this.room = next;
        }
        this.presence.set(playerId, now);
        if (next.phase === 'closed') return json({ closed: true });
        if (!next.players.some(p => p.id === playerId)) return json({ left: true });
        const state = roomView(this.room, playerId, now);
        state.players = state.players.map(p => ({ ...p, online: (this.presence.get(p.id) || 0) + 15000 > now }));
        return json({ state });
      } catch (error) {
        const known = /sala|partida|nombre|anfitrión|respuestas|colores|código|configuración|jugador|preguntas|acción|sesión/i.test(error.message);
        return json({ error: known ? error.message : 'No se pudo guardar. Inténtalo de nuevo.' }, known ? 400 : 503);
      }
    });
  }
  async alarm() {
    await this.ctx.blockConcurrencyWhile(async () => {
      if (this.room && this.room.expiresAt > Date.now()) { await this.ctx.storage.setAlarm(this.room.expiresAt); return; }
      await this.ctx.storage.deleteAll(); this.room = null; this.presence.clear(); this.rate.clear();
    });
  }
}
export class AccessGate {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const { key, kind } = await body(request), now = Date.now();
      const entries = await this.ctx.storage.get('limits') || {};
      for (const [id, value] of Object.entries(entries)) if (value.expires <= now) delete entries[id];
      const id = `${kind}:${key}`, current = entries[id];
      if (current && current.count >= (kind === 'create' ? 5 : 40)) return json({ error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.' }, 429);
      if (!current && Object.keys(entries).length >= 4096) return json({ error: 'El servicio está ocupado. Inténtalo más tarde.' }, 429);
      entries[id] = current ? { ...current, count: current.count + 1 } : { count: 1, expires: now + (kind === 'create' ? 600000 : 60000) };
      await this.ctx.storage.transaction(async () => {
        await this.ctx.storage.put('limits', entries);
        await this.ctx.storage.setAlarm(Math.max(...Object.values(entries).map(v => v.expires)));
      });
      return json({ ok: true });
    });
  }
  async alarm() { await this.ctx.blockConcurrencyWhile(() => this.ctx.storage.deleteAll()); }
}
