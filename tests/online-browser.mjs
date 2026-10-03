// Two independent browser sessions + invite; optional external Playwright installation.
// node tests/online-browser.mjs PATH_TO_PLAYWRIGHT [web-url] [api-url]
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const root = process.argv[3] || 'http://localhost:8000/';
const api = process.argv[4] || 'http://127.0.0.1:8787';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], results = [];
const contexts = await Promise.all([1280,320,390].map(width => browser.newContext({ viewport: { width, height: 900 } })));
if (['localhost','127.0.0.1'].includes(new URL(root).hostname)) {
  for (const ctx of contexts) await ctx.route('**/js/online-config.js', route => route.fulfill({ contentType: 'text/javascript', body: `export const ONLINE_API = ${JSON.stringify(api)};` }));
}
const [host, guest, invited] = await Promise.all(contexts.map(ctx => ctx.newPage()));
for (const page of [host,guest,invited]) page.on('pageerror', e => errors.push(e.message));
const catalog = await (await host.request.get(`${root}data/questions.es.json`)).json();
let code;
const game = page => page.evaluate(() => JSON.parse(localStorage.getItem('de-que-color.online.v1')));
async function request(page, path = '', input) {
  return page.evaluate(async ({ api, path, input }) => {
    const session = JSON.parse(localStorage.getItem('de-que-color.online.v1'));
    const response = await fetch(`${api}/rooms/${session.code}${path}`, {
      method: input ? 'POST' : 'GET', headers: { Authorization: `Bearer ${session.token}`, ...(input ? { 'Content-Type': 'application/json' } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
    }); return { status: response.status, ...await response.json() };
  }, { api, path, input });
}
async function answer(page, colors) { for (const c of colors) await page.locator(`#color-${c}`).click(); await page.getByRole('button', { name: 'Confirmar respuesta', exact: true }).click(); await page.getByText('Tu respuesta está guardada:', { exact: false }).waitFor(); }
async function rename(page, name) {
  await page.getByRole('button', { name: 'Cambiar mi nombre', exact: true }).click();
  await page.locator('#edit-online-name').fill(name);
  await page.locator('#dialog').getByRole('button', { name: 'Guardar nombre', exact: true }).click();
}
async function test(name, fn) { await fn(); results.push(name); console.log('PASS', name); }
try {
  await test('Crear sala, cuatro dígitos, invitados por código/enlace y permisos de anfitrión', async () => {
    await host.goto(root, { waitUntil: 'domcontentloaded' }); await host.locator('.mode-card').filter({ has: host.getByRole('heading', { name: 'Jugar en línea', exact: true }) }).click();
    await host.locator('#online-name').fill('Ana'); await host.getByRole('button', { name: 'Crear una sala', exact: true }).click();
    await host.locator('#duration').selectOption('10'); await host.getByRole('button', { name: 'Crear sala →', exact: true }).click();
    await host.getByRole('heading', { name: 'Sala de espera' }).waitFor();
    code = (await host.locator('.room-code').innerText()); assert.match(code, /^\d{4}$/);
    assert.ok(await host.getByRole('button', { name: 'Empezar partida', exact: true }).isDisabled());
    await guest.goto(root); await guest.locator('.mode-card').filter({ has: guest.getByRole('heading', { name: 'Jugar en línea', exact: true }) }).click();
    await guest.locator('#online-name').fill('Luis'); await guest.locator('#room-code').fill(code);
    await guest.getByRole('button', { name: 'Unirme a la sala', exact: true }).click(); await guest.getByRole('heading', { name: 'Sala de espera' }).waitFor();
    const link = await host.locator('.invite-link').getAttribute('href'); assert.equal(new URL(link).search, `?sala=${code}`);
    await invited.goto(link); await invited.getByRole('heading', { name: 'Sala de espera' }).waitFor();
    assert.equal(await guest.getByRole('button', { name: 'Empezar partida', exact: true }).count(), 0);
    await host.waitForFunction(() => document.querySelectorAll('.room-members li').length === 3);
    assert.equal((await request(guest, '/action', { action: 'start' })).status, 400);
    assert.ok(await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await invited.screenshot({ path: 'artifacts/sala-en-linea.png', fullPage: true });
  });
  await test('Personalizar nombres por enlace, código y anfitrión; sincronización, validación y recarga', async () => {
    const before = (await request(invited)).state;
    await rename(invited, 'Ana'); await invited.getByText('Ya hay alguien con ese nombre.', { exact: false }).waitFor();
    assert.equal((await request(invited)).state.players.find(p => p.id === before.myId).name, before.players.find(p => p.id === before.myId).name);
    await rename(invited, '<b>María</b>'); await host.locator('.room-members').getByText('<b>María</b>', { exact: true }).waitFor();
    assert.equal(await host.locator('.room-members b').count(), 0);
    await invited.reload(); await invited.getByRole('button', { name: 'Volver a la sala', exact: true }).click();
    await invited.getByText('Juegas como <b>María</b>', { exact: true }).waitFor();
    assert.equal((await request(invited)).state.myId, before.myId);
    await rename(host, 'Anfitriona'); await rename(guest, 'Luis Miguel');
    await invited.locator('.room-members').getByText('Anfitriona', { exact: true }).waitFor();
    await invited.locator('.room-members').getByText('Luis Miguel', { exact: true }).waitFor();
  });
  await test('Respuestas privadas, selección exacta, confirmación simultánea y sesión recuperada', async () => {
    await host.getByRole('button', { name: 'Empezar partida', exact: true }).click();
    await Promise.all([host,guest,invited].map(p => p.locator('.color-grid').waitFor()));
    const state = (await request(host)).state; const colors = catalog.questions.find(q => q.id === state.question.id).answerColors;
    assert.equal(state.question.answerColors, undefined); assert.equal(state.result, null);
    assert.ok(await guest.getByRole('button', { name: 'Confirmar respuesta', exact: true }).isDisabled());
    await Promise.all([answer(host, colors), answer(guest, colors)]);
    const view = (await request(invited)).state; assert.equal(view.ownAnswer, null); assert.equal(view.result, null); assert.equal(view.answers, undefined);
    assert.equal(view.players.filter(p => p.submitted).length, 2);
    const before = await game(guest);
    await guest.reload(); await guest.getByRole('button', { name: 'Volver a la sala', exact: true }).click();
    await guest.getByText('Tu respuesta está guardada:', { exact: false }).waitFor();
    const after = await game(guest); assert.equal(before.token === after.token, true); assert.equal(before.code, after.code);
    assert.equal(await guest.locator('.color-grid').count(), 0);
    const answered = (await request(guest)).state;
    await rename(guest, 'Luis en partida');
    const renamed = (await request(guest)).state;
    assert.equal(renamed.myId, answered.myId); assert.deepEqual(renamed.ownAnswer, answered.ownAnswer);
    await answer(invited, colors);
    await host.getByRole('button', { name: 'Revelar solución', exact: true }).waitFor();
    assert.ok(await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  await test('Solución simultánea, puntuación sin duplicados, anulación y siguiente ronda', async () => {
    await host.getByRole('button', { name: 'Revelar solución', exact: true }).click();
    await Promise.all([host,guest,invited].map(p => p.locator('.solution-card').first().waitFor()));
    assert.ok(!(await guest.locator('#main').innerText()).split('\n').includes('null'));
    assert.ok((await guest.locator('.score-number').allTextContents()).every(t => t.startsWith('1')));
    await rename(guest, 'Luis con puntos');
    await host.locator('.score-list').getByText('Luis con puntos', { exact: true }).waitFor();
    assert.ok((await guest.locator('.score-number').allTextContents()).every(t => t.startsWith('1')));
    assert.equal((await request(host, '/action', { action: 'reveal', round: 0 })).state.completed, 1);
    await guest.screenshot({ path: 'artifacts/solucion-en-linea-movil.png', fullPage: true });
    await host.getByRole('button', { name: 'Anular pregunta', exact: true }).click();
    await host.locator('#dialog').getByRole('button', { name: 'Anular pregunta', exact: true }).click();
    await guest.getByText('Pregunta anulada.', { exact: false }).waitFor();
    assert.ok((await guest.locator('.score-number').allTextContents()).every(t => t.startsWith('0')));
    await host.getByRole('button', { name: 'Siguiente pregunta →', exact: true }).click();
    await guest.locator('.color-grid').waitFor(); assert.equal((await request(guest)).state.round, 1);
  });
  await test('Cerrar ronda confirma ausentes a cero; partida completa y cierre compartido', async () => {
    await host.getByRole('button', { name: 'Cerrar ronda y revelar', exact: true }).click();
    await host.locator('#dialog').getByRole('button', { name: 'Cerrar y revelar', exact: true }).click();
    await guest.locator('.solution-card').first().waitFor();
    let state = (await request(host)).state; assert.ok(state.players.every(p => p.score === 0));
    for (let i = 0; i < 9; i++) {
      state = (await request(host, '/action', { action: 'next', round: state.round })).state;
      const colors = catalog.questions.find(q => q.id === state.question.id).answerColors;
      await Promise.all([host,guest,invited].map(p => request(p, '/action', { action: 'answer', round: state.round, colors })));
      state = (await request(host, '/action', { action: 'reveal', round: state.round })).state;
      assert.equal(state.completed, i + 2);
      // Keep within per-player request limit even when testing faster than a human.
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    state = (await request(host, '/action', { action: 'next', round: state.round })).state;
    assert.equal(state.phase, 'finished'); assert.ok(state.players.every(p => p.score === 9));
    await Promise.all([host,guest,invited].map(p => p.getByRole('heading', { name: '¡Victoria compartida!' }).waitFor()));
    await host.getByRole('button', { name: 'Cerrar sala', exact: true }).click();
    await host.locator('#dialog').getByRole('button', { name: 'Cerrar sala', exact: true }).click();
    await host.getByRole('heading', { name: 'Jugar en línea', exact: true }).waitFor();
    await guest.getByRole('heading', { name: 'Jugar en línea', exact: true }).waitFor();
    assert.equal(await game(guest), null); assert.ok((await guest.locator('#notice').innerText()).includes('cerrado la sala'));
  });
  await test('Sin errores de JavaScript ni desbordamiento a 320 px', async () => {
    assert.equal(errors.length, 0); assert.ok(await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/online-browser-results.json', JSON.stringify({ site: root, api, passed: results.length, results, errors }, null, 2));
  console.log(`${results.length}/${results.length} comprobaciones multijugador correctas`);
} finally {
  // Cleanup a test room on failure, without logging the private session.
  try { await request(host, '/action', { action: 'close' }); } catch {}
  await browser.close();
}
