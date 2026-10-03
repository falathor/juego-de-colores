import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/questions.es.json' with { type: 'json' };
import { CATEGORIES } from '../js/catalog.js';
import { createRoom, joinRoom, actOnRoom, roomView, ROOM_LIFETIME, validCode } from '../js/online-game.js';
import worker, { ColorRoom, AccessGate } from '../backend/worker.js';
import { OnlineClient } from '../js/online-client.js';

const config = { duration: 10, categories: CATEGORIES.map(c => c.id), difficulty: 'todas' };
const host = { id: 'host', name: 'Ana', authHash: 'host-hash' }, guest = { id: 'guest', name: 'Luis', authHash: 'guest-hash' };
const lobby = () => joinRoom(createRoom('0042', host, config, catalog), guest);
const started = () => actOnRoom(lobby(), host.id, { action: 'start' });
const action = (room, id, name, extra = {}) => actOnRoom(room, id, { action: name, round: room.round, ...extra });
test('Personalizar nombre propio en cualquier fase conserva identidad, rol, respuestas y puntos', () => {
  let room = lobby();
  const named = actOnRoom(room, guest.id, { action: 'rename', name: '  Lucía  ', playerId: host.id });
  assert.equal(named.players[1].name, 'Lucía'); assert.deepEqual(named.players[0], host);
  assert.equal(room.players[1].name, 'Luis'); assert.equal(named.players[1].id, guest.id);
  assert.equal(action(named, guest.id, 'rename', { name: 'Lucía' }), named);
  room = action(named, host.id, 'start'); room = action(room, guest.id, 'answer', { colors: room.order[0].answerColors });
  const answering = action(room, guest.id, 'rename', { name: '<b>Lucía</b>' });
  assert.deepEqual(answering.answers, room.answers); assert.equal(answering.hostId, room.hostId);
  room = action(answering, host.id, 'reveal', { force: true });
  for (const phase of ['result','finished']) {
    const before = { ...room, phase };
    const after = action(before, guest.id, 'rename', { name: phase });
    assert.deepEqual(after.results, before.results); assert.deepEqual(after.answers, before.answers);
    assert.equal(roomView(after, guest.id).players[1].score, 1);
    assert.deepEqual({ ...after, players: before.players, revision: before.revision }, before);
  }
  const renamedHost = action(room, host.id, 'rename', { name: 'Anfitriona' });
  assert.equal(renamedHost.hostId, host.id); assert.equal(renamedHost.players[0].name, 'Anfitriona');
});
test('Cambio de nombre rechaza inválidos, duplicados y sesiones ajenas sin mutación', () => {
  const room = lobby(), before = structuredClone(room);
  for (const name of [undefined, '', ' ', 'a'.repeat(25), '\nLuis', 42, 'ANA', ' Ana ']) {
    assert.throws(() => action(room, guest.id, 'rename', { name }));
    assert.deepEqual(room, before);
  }
  assert.throws(() => action(room, 'intruder', 'rename', { name: 'Otro' }));
  const automatic = joinRoom(action(room, host.id, 'rename', { name: 'jugador 1' }), { id: 'invite', name: '', authHash: 'invite-hash' });
  assert.equal(automatic.players.at(-1).name, 'Jugador 2');
});
test('Códigos conservan ceros iniciales; configuración, nombres y catálogo se validan', () => {
  assert.equal(validCode('0042'), true); assert.equal(validCode('42'), false);
  assert.throws(() => createRoom('42', host, config, catalog));
  for (const patch of [{ duration: 99 }, { categories: [] }, { categories: ['desconocida'] }, { difficulty: '__proto__' }]) assert.throws(() => createRoom('0042', host, { ...config, ...patch }, catalog));
  for (const name of [' ', 'a'.repeat(25), '\nLuis', 42]) assert.throws(() => joinRoom(lobby(), { ...guest, id: 'new', name }));
  const room = lobby(); assert.equal(room.order.length, 198); assert.equal(new Set(room.order.map(q => q.id)).size, 198);
  assert.equal(createRoom('0042', host, { ...config, categories: ['series'], difficulty: 'dificil' }, catalog).target, 1);
});
test('Sala admite de dos a ocho personas, nombres únicos y no admite entradas tras empezar', () => {
  let room = createRoom('0042', host, config, catalog);
  assert.throws(() => action(room, host.id, 'start'));
  assert.throws(() => joinRoom(room, { ...guest, name: 'aNa' }));
  for (let i = 1; i < 8; i++) room = joinRoom(room, { id: `p${i}`, name: '', authHash: `h${i}` });
  assert.equal(room.players.length, 8); assert.equal(new Set(room.players.map(p => p.name)).size, 8);
  assert.throws(() => joinRoom(room, guest));
  assert.throws(() => joinRoom(started(), { ...guest, id: 'new' }));
});
test('Estado previo oculta solución, mazo, claves y respuestas ajenas incluso al anfitrión', () => {
  let room = started(); room = action(room, guest.id, 'answer', { colors: room.order[0].answerColors });
  const view = roomView(room, host.id), own = roomView(room, guest.id);
  assert.equal(view.question.answerColors, undefined); assert.equal(view.question.explanation, undefined);
  assert.equal(view.order, undefined); assert.equal(view.answers, undefined); assert.equal(view.result, null);
  assert.equal(view.ownAnswer, null); assert.deepEqual(own.ownAnswer, room.order[0].answerColors);
  assert.equal(view.players.find(p => p.id === guest.id).submitted, true);
  assert.ok(!JSON.stringify(view).includes('authHash')); assert.ok(!JSON.stringify(view).includes('guest-hash'));
});
test('Solo anfitrión inicia, revela, anula, avanza y cierra; desconocidos no acceden', () => {
  for (const name of ['start','reveal','next','void','close']) assert.throws(() => action(started(), guest.id, name));
  assert.throws(() => roomView(started(), 'intruder')); assert.throws(() => action(started(), 'intruder', 'answer'));
});
test('Confirmación exacta, bloqueada e idempotente; comandos antiguos no afectan otra ronda', () => {
  let room = started();
  for (const colors of [[], ['rojo','rojo'], ['inexistente'], null]) assert.throws(() => action(room, host.id, 'answer', { colors }));
  room = action(room, host.id, 'answer', { colors: [...room.order[0].answerColors].reverse() });
  assert.equal(action(room, host.id, 'answer', { colors: ['rojo'] }), room);
  assert.throws(() => action(room, host.id, 'reveal'));
  room = action(room, guest.id, 'answer', { colors: room.order[0].answerColors });
  room = action(room, host.id, 'reveal'); assert.equal(roomView(room, host.id).players[0].score, 1);
  assert.equal(action(room, host.id, 'reveal'), room);
  room = action(room, host.id, 'next');
  assert.equal(actOnRoom(room, host.id, { action: 'answer', round: 0, colors: ['rojo'] }), room);
});
test('Cerrar ronda exige confirmación; ausentes reciben cero; anular revierte solo puntos actuales', () => {
  let room = started(); room = action(room, host.id, 'answer', { colors: room.order[0].answerColors });
  room = action(room, host.id, 'reveal', { force: true });
  assert.deepEqual(roomView(room, host.id).players.map(p => p.score), [1,0]);
  room = action(room, host.id, 'next'); room = action(room, host.id, 'answer', { colors: room.order[1].answerColors });
  room = action(room, host.id, 'reveal', { force: true }); room = action(room, host.id, 'void');
  assert.equal(action(room, host.id, 'void'), room); assert.equal(roomView(room, host.id).completed, 1);
  assert.deepEqual(roomView(room, host.id).players.map(p => p.score), [1,0]);
  room = action(room, host.id, 'next'); assert.equal(room.round, 2); assert.equal(room.phase, 'answering');
});
test('Partida completa y agotamiento terminan con puntuación única; abandono y caducidad', () => {
  let room = started(); const now = Date.now();
  for (let i = 0; i < 10; i++) {
    for (const p of room.players) room = action(room, p.id, 'answer', { colors: room.order[room.round].answerColors });
    room = action(room, host.id, 'reveal'); room = action(room, host.id, 'next');
  }
  assert.equal(room.phase, 'finished'); assert.equal(roomView(room, host.id).completed, 10);
  assert.deepEqual(roomView(room, host.id).players.map(p => p.score), [10,10]);
  assert.throws(() => roomView(room, host.id, now + ROOM_LIFETIME + 1000));
  assert.throws(() => roomView(action(room, host.id, 'close'), host.id));
  assert.equal(action(lobby(), guest.id, 'leave').players.length, 1);
  assert.throws(() => action(started(), guest.id, 'leave'));
  room = joinRoom(createRoom('0042', host, { ...config, categories: ['series'], difficulty: 'dificil' }, catalog), guest);
  room = action(room, host.id, 'start'); room = action(room, host.id, 'reveal', { force: true }); room = action(room, host.id, 'void'); room = action(room, host.id, 'next');
  assert.equal(room.phase, 'finished'); assert.equal(roomView(room, host.id).completed, 0);
});

// Dedicated in-memory test storage; never connects to a deployed namespace.
function context() {
  const ctx = { queue: Promise.resolve(), values: new Map(), alarm: null, fail: '' };
  ctx.blockConcurrencyWhile = fn => { const result = ctx.queue.then(fn); ctx.queue = result.catch(() => {}); return result; };
  ctx.storage = {
    async get(k) { return structuredClone(ctx.values.get(k)); },
    async put(k,v) { if (ctx.fail === 'put') throw Error('write failure'); ctx.values.set(k, structuredClone(v)); },
    async setAlarm(time) { if (ctx.fail === 'alarm') throw Error('alarm failure'); ctx.alarm = time; },
    async deleteAll() { ctx.values.clear(); ctx.alarm = null; },
    async transaction(fn) { const before = structuredClone(ctx.values), alarm = ctx.alarm; try { return await fn(); } catch (e) { ctx.values = before; ctx.alarm = alarm; throw e; } },
  }; return ctx;
}
const internal = (path, input, authHash) => new Request(`https://internal/${path}`, { method: input ? 'POST' : 'GET', headers: authHash ? { 'X-Auth-Hash': authHash } : {}, ...(input ? { body: JSON.stringify(input) } : {}) });
test('Reserva de código no reemplaza sala existente; operaciones concurrentes conservan ambas respuestas', async () => {
  const ctx = context(), service = new ColorRoom(ctx);
  assert.equal((await service.fetch(internal('create', { code: '0042', player: host, config }))).status, 200);
  assert.equal((await service.fetch(internal('create', { code: '0042', player: host, config }))).status, 409);
  await service.fetch(internal('join', { player: guest })); await service.fetch(internal('action', { action: 'start' }, host.authHash));
  const colors = service.room.order[0].answerColors;
  const responses = await Promise.all([host, guest].map(p => service.fetch(internal('action', { action: 'answer', round: 0, colors }, p.authHash))));
  assert.ok(responses.every(r => r.ok)); assert.equal(Object.keys(service.room.answers).length, 2);
  assert.equal((await service.fetch(internal('state', undefined, 'wrong'))).status, 401);
});
test('Fallo intermedio al crear revierte documento y alarma; reintento es posible', async () => {
  const ctx = context(), service = new ColorRoom(ctx); ctx.fail = 'alarm';
  const response = await service.fetch(internal('create', { code: '0042', player: host, config }));
  assert.equal(response.status, 503); assert.equal(ctx.values.has('room'), false); assert.equal(service.room, null); assert.equal(ctx.alarm, null);
  ctx.fail = ''; assert.equal((await service.fetch(internal('create', { code: '0042', player: host, config }))).status, 200);
  const before = structuredClone(service.room); ctx.fail = 'put';
  assert.equal((await service.fetch(internal('join', { player: guest }))).status, 503);
  assert.deepEqual(service.room, before); assert.deepEqual(ctx.values.get('room'), before);
});
test('Límites de acceso atómicos y limpieza automática de datos', async () => {
  const ctx = context(), gate = new AccessGate(ctx); ctx.fail = 'alarm';
  await assert.rejects(gate.fetch(internal('access', { key: 'test-ip', kind: 'create' }))); assert.equal(ctx.values.size, 0);
  ctx.fail = ''; for (let i = 0; i < 5; i++) assert.equal((await gate.fetch(internal('access', { key: 'test-ip', kind: 'create' }))).status, 200);
  assert.equal((await gate.fetch(internal('access', { key: 'test-ip', kind: 'create' }))).status, 429);
  await gate.alarm(); assert.equal(ctx.values.size, 0);
  const roomCtx = context(), room = new ColorRoom(roomCtx);
  await room.fetch(internal('create', { code: '0042', player: host, config }));
  room.room.expiresAt = Date.now() - 1; await room.alarm(); assert.equal(room.room, null); assert.equal(roomCtx.values.size, 0);
});
test('API comprueba origen, método, autenticación, tamaño y preflight', async () => {
  const env = { ALLOWED_ORIGINS: 'https://test.example', ROOMS: { idFromName: x => x, get: () => ({ fetch: async () => Response.json({ state: {} }) }) } };
  const req = (path, method = 'GET', extra = {}) => new Request(`https://service${path}`, { method, headers: { Origin: 'https://test.example', ...extra } });
  assert.equal((await worker.fetch(new Request('https://service/rooms/0042'), env)).status, 403);
  assert.equal((await worker.fetch(req('/rooms/0042'), env)).status, 401);
  assert.equal((await worker.fetch(req('/rooms/0042/join', 'GET', { Authorization: `Bearer ${'a'.repeat(64)}` }), env)).status, 405);
  const options = await worker.fetch(req('/rooms/0042', 'OPTIONS'), env);
  assert.equal(options.status, 204); assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'https://test.example');
  const oversized = new Request('https://service/rooms/0042/action', { method: 'POST', headers: { Origin: 'https://test.example', Authorization: `Bearer ${'a'.repeat(64)}` }, body: 'x'.repeat(4097) });
  assert.equal((await worker.fetch(oversized, env)).status, 400);
});
const memoryStore = () => { const values = new Map(); return { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; };
test('Cliente guarda identidad, recarga, no pone clave en URL y mantiene sesión al fallar red', async () => {
  const store = memoryStore(), calls = [], notices = [];
  const state = roomView(lobby(), host.id);
  const fetcher = async function(url, options) { assert.equal(this, undefined, 'fetch nativo debe invocarse sin receptor del cliente'); calls.push({ url, options }); return Response.json(url.endsWith('/rooms') ? { state, token: 'a'.repeat(64) } : { state }); };
  const client = new OnlineClient({ endpoint: 'https://test.service', store, fetcher, onState() {}, onNotice: s => notices.push(s) });
  await client.enter(undefined, 'Ana', config); client.pause();
  const restored = new OnlineClient({ endpoint: 'https://test.service', store, fetcher, onState() {}, onNotice: s => notices.push(s) });
  await restored.resume(); restored.pause(); assert.equal(restored.state.myId, host.id);
  assert.ok(calls.every(c => !c.url.includes('a'.repeat(64)))); assert.ok(calls.at(-1).options.headers.Authorization);
  restored.fetcher = async () => { throw new TypeError('offline'); }; await restored.refresh(); restored.pause();
  assert.ok(restored.session); assert.equal(notices.length, 1);
  restored.fetcher = (...args) => fetcher(...args); await restored.refresh(); restored.pause(); assert.equal(notices.at(-1), 'Conexión recuperada.');
  restored.fetcher = async () => Response.json({ error: 'El anfitrión ha cerrado la sala.' }, { status: 400 });
  await restored.refresh(); assert.equal(restored.session, null); assert.equal(store.getItem('de-que-color.online.v1'), undefined);
});
test('Cliente ignora respuestas antiguas y sobrevive al bloqueo de almacenamiento', () => {
  const notices = [], state = roomView(lobby(), host.id);
  const client = new OnlineClient({ endpoint: 'https://test.service', store: { getItem() { throw Error(); }, setItem() { throw Error(); } }, onState() {}, onNotice: s => notices.push(s) });
  client.accept({ state: { ...state, revision: 3 } }); client.accept({ state: { ...state, revision: 1 } }); assert.equal(client.state.revision, 3);
  client.session = { code: '0042', token: 'a'.repeat(64) }; client.save(); assert.equal(notices.length, 2); client.pause();
});
