// Optional verification with externally installed Playwright. No app dependency.
// node tests/browser-smoke.mjs /absolute/path/to/playwright/index.mjs [site-url]
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
if (!process.argv[2]) throw new Error('Pass the absolute path to an external Playwright index.mjs');
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const artifacts = new URL('../artifacts/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const results = [], errors = [];
function assert(value, description) { if (!value) throw new Error(description); }
async function test(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, ok: false, error: error.message }); console.log('FAIL', name, error.message); }
}
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`); });
const root = process.argv[3] || 'http://localhost:8000/';
const origin = new URL(root).origin;
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('de-que-color.partida.v1')));
async function availableQuestions(categories, difficulty) {
  const catalog = await (await page.request.get(`${root}data/questions.es.json`)).json();
  return catalog.questions.filter(q => q.status === 'approved' && categories.includes(q.category)
    && (difficulty === 'todas' || q.difficulty === difficulty)).length;
}
async function fresh() { await page.goto(root); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.getByRole('heading', { name: 'Jugar en línea', exact: true }).waitFor(); }
async function legacySolo(filters = {}) {
  await page.evaluate(async patch => {
    const { loadCatalog, CATEGORIES } = await import('./js/catalog.js');
    const { createGame } = await import('./js/game.js');
    localStorage.setItem('de-que-color.partida.v1', JSON.stringify(createGame(await loadCatalog(), {
      mode: 'solo', duration: 10, difficulty: 'todas', categories: CATEGORIES.map(c => c.id), ...patch,
    })));
  }, filters);
  await page.reload(); await page.getByRole('button', { name: 'Continuar partida' }).click();
}
async function mode(name, count = '10') {
  await page.locator('.mode-card').filter({ has: page.getByRole('heading', { name, exact: true }) }).click();
  await page.locator('#duration').selectOption(count);
}
async function start() { await page.getByRole('button', { name: 'Empezar partida →' }).click(); }
async function soloAnswer(correct = true) {
  await page.getByRole('button', { name: 'Elegir colores', exact: true }).click();
  const game = await saved(); const q = game.order[game.cursor];
  const colors = correct ? q.answerColors : ['rojo', 'amarillo', 'azul', 'verde'].filter(c => !q.answerColors.includes(c)).slice(0, q.answerColors.length);
  for (const c of colors) await page.locator(`#color-${c}`).click();
  await page.getByRole('button', { name: 'Confirmar respuesta', exact: true }).click();
}
await test('Inicio completo y sin conexiones externas de ejecución', async () => {
  const external = []; page.on('request', req => { if (new URL(req.url()).origin !== origin) external.push(req.url()); });
  await page.goto(root); await page.locator('.mode-card').first().waitFor();
  assert(await page.locator('.mode-card').count() === 3, 'Faltan modos');
  assert((await page.locator('.facts').innerText()).includes('198 preguntas'), 'Falta el catálogo');
  assert(external.length === 0, 'Se descargan recursos externos');
  await page.screenshot({ path: new URL('inicio-escritorio.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
});
await test('Navegador: ejecutor de 28 pruebas', async () => {
  await page.goto(`${root}tests/`); await page.locator('#summary[data-passed=true]').waitFor();
  assert(await page.locator('#results li').count() === 28, 'Conteo de pruebas inesperado');
});
await test('Mazo físico sin marcador: respuesta oculta y diez rondas completas', async () => {
  await fresh(); await mode('Jugar con cartas'); await start();
  for (let i = 0; i < 10; i++) {
    assert(await page.locator('.solution-colors').count() === 0, 'Solución revelada antes de tiempo');
    assert(await page.locator('.color-grid').count() === 0, 'Selector digital en modo físico');
    assert((await page.locator('.game-top').innerText()).includes(`Ronda ${i + 1} de 10`), 'Progreso incorrecto');
    await page.getByRole('button', { name: 'Ver respuesta', exact: true }).click();
    assert(await page.locator('.solution-colors').count() === 1, 'No se revela solución');
    if (i === 0) await page.screenshot({ path: new URL('solucion-cartas.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    await page.getByRole('button', { name: i === 9 ? 'Ver resultado final' : 'Siguiente pregunta →', exact: true }).click();
  }
  assert((await page.locator('h1').innerText()).includes('Mazo completado'), 'No termina');
});
await test('Individual anterior: sesión compatible, teclado, límite, guardado y partida completa', async () => {
  await fresh(); await legacySolo();
  await page.getByRole('button', { name: 'Elegir colores', exact: true }).click();
  const q = (await saved()).order[0];
  assert(await page.getByRole('button', { name: 'Confirmar respuesta' }).isDisabled(), 'Confirmar vacío permitido');
  for (const c of q.answerColors) { await page.locator(`#color-${c}`).focus(); await page.keyboard.press('Space'); }
  const extra = ['rojo', 'azul', 'verde', 'negro', 'blanco'].find(c => !q.answerColors.includes(c));
  await page.locator(`#color-${extra}`).click();
  assert((await page.locator('#notice').innerText()).includes('Solo puedes elegir'), 'Falta mensaje de límite');
  assert((await saved()).selection.length === q.answerColors.length, 'Se supera el máximo');
  await page.reload(); await page.getByRole('button', { name: 'Continuar partida' }).click();
  assert(await page.locator('.color-grid').count() === 0, 'Se expone selección al recargar');
  await page.getByRole('button', { name: 'Empezar respuesta' }).click();
  assert(await page.locator('[aria-pressed=true].color-button').count() === q.answerColors.length, 'Selección perdida');
  await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
  await page.reload(); await page.getByRole('button', { name: 'Continuar partida' }).click();
  assert((await saved()).results.length === 1, 'Ronda duplicada tras recarga');
  await page.getByRole('button', { name: 'Siguiente pregunta →' }).click();
  for (let i = 1; i < 10; i++) {
    await soloAnswer(); await page.getByRole('button', { name: i === 9 ? 'Ver resultado final' : 'Siguiente pregunta →', exact: true }).click();
  }
  assert((await page.locator('.big-score').innerText()) === '10 / 10', 'Marcador incorrecto');
  assert((await page.locator('.final-panel').innerText()).includes('100 %'), 'Falta porcentaje');
});
await test('Pasa el móvil: equipos privados, recarga y empate final', async () => {
  await fresh(); await mode('Pasa el móvil');
  await page.locator('#name-0').fill('<img src=x>'); await page.locator('#name-1').fill('Equipo B');
  await start();
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Empezar los turnos' }).click();
    for (let team = 0; team < 2; team++) {
      assert(await page.locator('.color-grid').count() === 0, 'Selecciones visibles al cambiar de equipo');
      assert(await page.locator('.solution-colors').count() === 0, 'Solución prematura');
      await page.getByRole('button', { name: 'Empezar respuesta' }).click();
      const q = (await saved()).order[i];
      for (const c of q.answerColors) await page.locator(`#color-${c}`).click();
      await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
      if (i === 0 && team === 0) {
        await page.reload(); await page.getByRole('button', { name: 'Continuar partida' }).click();
        assert((await saved()).active === 1, 'Turno recuperado incorrecto');
      }
    }
    assert(await page.locator('.color-grid').count() === 0, 'Selecciones visibles antes de revelar');
    await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
    assert(await page.locator('.score-row').count() === 2, 'Faltan resultados de equipos');
    assert(await page.locator('img').count() === 0, 'Nombre interpretado como HTML');
    if (i === 0) await page.screenshot({ path: new URL('resultado-equipos.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    await page.getByRole('button', { name: i === 9 ? 'Ver resultado final' : 'Siguiente pregunta →', exact: true }).click();
  }
  assert((await page.locator('h1').innerText()).includes('Victoria compartida'), 'No muestra empate');
  assert((await page.locator('.score-number').allTextContents()).every(t => t.includes('10')), 'Puntos incorrectos');
});
await test('Marcador físico y anulación: retirar solo puntos actuales, sustitución y agotamiento', async () => {
  await fresh(); await mode('Jugar con cartas', '30'); await page.locator('#scoreboard').check();
  await page.locator('#all-categories').click(); await page.locator('#category-espana').click();
  await page.locator('#difficulty').selectOption('medio');
  const available = await availableQuestions(['espana'], 'medio');
  assert(available > 1 && available < 30, 'El filtro no permite comprobar agotamiento');
  assert((await page.locator('#availability').innerText()).includes(`${available} rondas`), 'No avisa de pocas preguntas');
  await start(); await page.getByRole('button', { name: 'Ver respuesta', exact: true }).click();
  assert((await page.locator('.game-top').innerText()).includes('Ronda 1'), 'Ronda cero');
  await page.locator('#physical-team-0').click(); await page.locator('#physical-team-1').click();
  await page.getByRole('button', { name: 'Confirmar ronda' }).click();
  assert((await page.locator('.score-number').allTextContents()).every(t => t.startsWith('1')), 'Aciertos no suman');
  await page.getByRole('button', { name: 'Anular pregunta', exact: true }).click();
  await page.locator('#dialog').getByRole('button', { name: 'Anular pregunta', exact: true }).click();
  assert((await page.locator('.score-number').allTextContents()).every(t => t.startsWith('0')), 'Anular no revierte');
  await page.getByRole('button', { name: 'Siguiente pregunta →' }).click();
  for (let i = 1; i < available; i++) {
    await page.getByRole('button', { name: 'Ver respuesta', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar ronda' }).click();
    await page.getByRole('button', { name: 'Siguiente pregunta →' }).click();
  }
  assert((await page.locator('.final-panel').innerText()).includes(`${available - 1} rondas válidas`), 'Anulación consume una ronda');
  assert((await page.locator('.final-panel').innerText()).includes('agotado'), 'Falta explicar agotamiento');
});
await test('Filtros vacíos, categorías OR y dificultad difícil', async () => {
  await fresh(); await mode('Pasa el móvil'); await page.locator('#all-categories').click();
  assert(await page.locator('#start-game').isDisabled(), 'Empieza sin preguntas');
  await page.locator('#category-series').click(); await page.locator('#category-comida').click();
  await page.locator('#difficulty').selectOption('dificil');
  const available = await availableQuestions(['series','comida'], 'dificil');
  assert(available > 0 && available < 10, 'El filtro no permite comprobar una partida corta');
  assert((await page.locator('#availability').innerText()).includes(`${available} rondas`), 'Filtros incorrectos');
  await start(); const s = await saved(); assert(s.target === available, 'Duración filtrada incorrecta');
});
await test('Fallos de localStorage: aviso y juego en memoria', async () => {
  const volatileContext = await browser.newContext();
  await volatileContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Denied'); } }));
  const p = await volatileContext.newPage(); await p.goto(root);
  await p.locator('.mode-card').filter({ has: p.getByRole('heading', { name: 'Pasa el móvil', exact: true }) }).click();
  await p.getByRole('button', { name: 'Empezar partida →' }).click();
  assert((await p.locator('#notice').innerText()).includes('no permite guardar') || (await p.locator('#notice').innerText()).includes('No se puede guardar'), 'Falta aviso');
  await p.getByRole('button', { name: 'Empezar los turnos', exact: true }).click();
  await p.getByRole('button', { name: 'Empezar respuesta', exact: true }).click();
  assert(await p.locator('.color-button').count() === 11, 'No se puede jugar sin persistencia');
  await volatileContext.close();
});
await test('Datos corruptos: inicio seguro y opción de borrar', async () => {
  await fresh(); await page.evaluate(() => localStorage.setItem('de-que-color.partida.v1', '{broken')); await page.reload();
  assert(await page.getByRole('button', { name: 'Borrar partida dañada' }).count() === 1, 'No gestiona corrupción');
  assert(await page.getByRole('button', { name: 'Continuar partida' }).count() === 0, 'Restaura corrupción');
});
await test('320 px, cuadrícula móvil, foco visible y zoom 200 % equivalente', async () => {
  await fresh(); await page.setViewportSize({ width: 320, height: 740 });
  await page.screenshot({ path: new URL('inicio-movil.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert(await fits(), 'Desbordamiento en inicio');
  await mode('Pasa el móvil'); assert(await fits(), 'Desbordamiento en configuración'); await start();
  assert(await fits(), 'Desbordamiento en pregunta');
  await page.getByRole('button', { name: 'Empezar los turnos', exact: true }).click();
  await page.getByRole('button', { name: 'Empezar respuesta', exact: true }).click(); assert(await fits(), 'Desbordamiento en selección');
  assert(await page.locator('.color-button').count() === 11, 'Colores faltantes');
  assert((await page.locator('.color-grid').evaluate(e => getComputedStyle(e).gridTemplateColumns)).split(' ').length === 3, 'No hay tres columnas');
  const sizes = await page.locator('.color-button').evaluateAll(nodes => nodes.map(n => ({ width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })));
  assert(sizes.every(s => s.width >= 44 && s.height >= 44), 'Controles demasiado pequeños');
  await page.locator('#color-rojo').focus();
  assert((await page.locator('#color-rojo').evaluate(e => getComputedStyle(e).outlineWidth)) !== '0px', 'Falta foco');
  await page.screenshot({ path: new URL('seleccion-movil.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  await page.setViewportSize({ width: 640, height: 450 }); assert(await fits(), 'Desbordamiento en viewport a escala de 200 %');
  await page.setViewportSize({ width: 1280, height: 900 });
});
await test('Solución: tarjetas grandes, nombres centrados y negrita, uno a cuatro colores y paleta completa', async () => {
  await fresh();
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colors of [['blanco'], ['azul','amarillo'], ['rojo','verde','morado'], ['rosa','marron','negro','gris'], ['naranja']]) {
      const layout = await page.evaluate(async ids => {
        const { mount, renderGame } = await import('./js/ui.js');
        const { createGame, reveal } = await import('./js/game.js');
        const catalog = await (await fetch('./data/questions.es.json')).json();
        const q = { ...catalog.questions[0], answerColors: ids,
          prompt: `Pregunta de prueba de presentación: elige ${ids.length} ${ids.length === 1 ? 'color' : 'colores'}.`,
          explanation: 'Datos ficticios para comprobar el tamaño y la posición de las tarjetas; no forman parte del catálogo.',
        };
        const game = createGame({ ...catalog, questions: [q] }, {
          mode: 'physical', duration: 10, categories: ['espana'], difficulty: 'todas', scoreboard: false,
        });
        const render = value => mount(renderGame({ game: value, transition: () => {}, home: () => {} }));
        render(game);
        const hidden = document.querySelectorAll('.solution-card').length === 0;
        render(reveal(game));
        const group = document.querySelector('.solution-colors').getBoundingClientRect();
        const cards = [...document.querySelectorAll('.solution-card')].map(node => {
          const r = node.getBoundingClientRect(), name = node.querySelector('strong'), t = name.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { width: r.width, height: r.height, left: r.left, right: r.right,
            dx: Math.abs((r.left + r.right - t.left - t.right) / 2),
            dy: Math.abs((r.top + r.bottom - t.top - t.bottom) / 2),
            weight: Number(getComputedStyle(name).fontWeight), border: parseFloat(style.borderLeftWidth),
            label: name.textContent, color: style.backgroundColor };
        });
        return { hidden, cards, center: (group.left + group.right) / 2, fits: document.documentElement.scrollWidth <= innerWidth };
      }, colors);
      assert(layout.hidden, 'Tarjetas antes de revelar');
      assert(layout.cards.length === colors.length, 'Faltan tarjetas');
      assert(layout.fits, 'Solución desborda');
      assert(layout.cards.every(c => c.width >= 140 && c.height >= 170 && c.dx < 1 && c.dy < 1 && c.weight >= 700 && c.border >= 1 && c.label), 'Tamaño, nombre, negrita o borde incorrectos');
      const center = (Math.min(...layout.cards.map(c => c.left)) + Math.max(...layout.cards.map(c => c.right))) / 2;
      assert(Math.abs(center - layout.center) < 1, 'Grupo de tarjetas descentrado');
      if (colors.length === 4 || (width === 1280 && colors.length === 2)) await page.screenshot({
        path: new URL(`tarjetas-${width}-${colors.length}.png`, artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
});
await test('GitHub Pages: subcarpeta carga CSS, módulos y JSON y permite terminar', async () => {
  await page.goto(process.argv[3] || 'http://localhost:8001/juego-de-colores/');
  await page.locator('.mode-card').first().waitFor(); await legacySolo({ categories: ['series'], difficulty: 'dificil' });
  assert((await saved()).target === 1, 'No carga datos bajo subcarpeta');
  await soloAnswer(); await page.getByRole('button', { name: 'Ver resultado final' }).click();
  assert((await page.locator('.big-score').innerText()) === '1 / 1', 'No termina bajo subcarpeta');
});
await test('Sin errores de consola durante todos los flujos', async () => assert(errors.length === 0, errors.join('; ')));
await writeFile(new URL('browser-results.json', artifacts), JSON.stringify({ browser: await browser.version(), results, errors }, null, 2) + '\n');
await browser.close();
if (results.some(r => !r.ok)) process.exitCode = 1;
console.log(`${results.filter(r => r.ok).length}/${results.length} comprobaciones de navegador correctas`);
