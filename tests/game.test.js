import * as g from '../js/game.js';
import { CATEGORIES, filteredQuestions, validateCatalog } from '../js/catalog.js';
import { createStorage, GAME_KEY, HISTORY_KEY } from '../js/storage.js';

const clone = value => JSON.parse(JSON.stringify(value));
const assert = (condition, message = 'Resultado inesperado') => { if (!condition) throw new Error(message); };
const equal = (a, b) => assert(JSON.stringify(a) === JSON.stringify(b), `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const rejects = fn => { let threw = false; try { fn(); } catch { threw = true; } assert(threw, 'Se esperaba rechazo'); };
function fixture(count = 12) {
  return { schemaVersion: 1, contentVersion: 'test', locale: 'es-ES', questions: Array.from({ length: count }, (_, i) => ({
    id: `test-${i}`, category: CATEGORIES[i % 8].id, difficulty: i % 2 ? 'medio' : 'facil',
    prompt: `¿Qué colores tiene el objeto de prueba ${i}?`, answerColors: ['rojo', 'amarillo'],
    explanation: 'Dato ficticio para comprobar las reglas.', tags: ['test'], status: 'approved',
    sources: [{ title: 'Fuente ficticia de prueba', url: 'https://example.org/test' }], reviewedAt: '2026-10-03',
  })) };
}
const config = (mode = 'pass', patch = {}) => ({ mode, categories: CATEGORIES.map(c => c.id), difficulty: 'todas',
  duration: 10, scoreboard: true, names: ['Uno', 'Dos'], ...patch });
const create = (mode = 'pass', count = 12, patch = {}) => g.createGame(fixture(count), config(mode, patch), [], () => .5);
function answer(game, colors = ['amarillo', 'rojo']) {
  game = g.startAnswer(game);
  for (const c of colors) game = g.toggleColor(game, c);
  return g.confirmAnswer(game);
}
function digitalRound(game, answers = [['amarillo', 'rojo'], ['rojo', 'amarillo']]) {
  game = g.showTurns(game);
  for (let i = 0; i < game.teams.length; i++) game = answer(game, answers[i] || answers[0]);
  return game.mode === 'solo' ? game : g.reveal(game);
}
export function runTests() {
  const cases = [];
  const test = (name, fn) => { try { fn(); cases.push({ name, ok: true }); } catch (e) { cases.push({ name, ok: false, error: e.message }); } };
  test('Conjuntos: acepta ambos órdenes, rechaza duplicados y coincidencias parciales', () => {
    assert(g.sameColors(['rojo', 'amarillo'], ['amarillo', 'rojo']));
    assert(!g.sameColors(['rojo', 'rojo'], ['rojo', 'amarillo']));
    assert(!g.sameColors(['rojo'], ['rojo', 'amarillo']));
    assert(!g.sameColors(['rojo', 'azul'], ['rojo', 'amarillo']));
  });
  test('Selección: no excede el máximo, permite quitar y bloquea confirmación incompleta', () => {
    let game = g.startAnswer(g.showTurns(create()));
    assert(g.confirmAnswer(game) === game);
    game = g.toggleColor(game, 'rojo'); assert(g.confirmAnswer(game) === game);
    game = g.toggleColor(game, 'amarillo'); assert(g.toggleColor(game, 'azul') === game);
    game = g.toggleColor(game, 'rojo'); equal(game.selection, ['amarillo']);
    assert(g.toggleColor(game, 'dorado') === game);
  });
  test('Paleta y soluciones de uno y cuatro colores', () => {
    for (const colors of [['blanco'], ['rojo', 'azul', 'verde', 'gris']]) {
      const cat = fixture(1); cat.questions[0].answerColors = colors;
      let game = g.createGame(cat, config('solo'));
      game = answer(game, [...colors].reverse());
      equal(g.scores(game).map(t => t.score), [1]);
    }
  });
  test('Turnos: ocultación inmediata y respuesta confirmada bloqueada', () => {
    const game = answer(g.showTurns(create()));
    equal(game.selection, []); equal(game.phase, 'neutral'); equal(game.active, 1);
    assert(g.confirmAnswer(game) === game); assert(g.reveal(game) === game);
    assert(g.toggleColor(game, 'azul') === game);
    const next = g.startAnswer(game); equal(next.selection, []);
    equal(next.answers['team-0'], ['amarillo', 'rojo']);
  });
  test('Cuatro equipos: todos los turnos se recuperan en privado y puntúan juntos', () => {
    let game = g.showTurns(create('pass', 12, { names: ['A', 'B', 'C', 'D'] }));
    for (let active = 0; active < 4; active++) {
      game = g.restoreGame(clone(game)); equal(game.phase, 'neutral'); equal(game.active, active);
      game = g.startAnswer(game); game = g.toggleColor(game, 'amarillo');
      game = g.restoreGame(clone(game)); equal(game.phase, 'neutral');
      game = g.startAnswer(game); game = g.toggleColor(game, 'rojo'); game = g.confirmAnswer(game);
      equal(game.selection, []);
    }
    equal(game.phase, 'ready'); game = g.reveal(g.restoreGame(clone(game)));
    equal(g.scores(game).map(t => t.score), [1, 1, 1, 1]);
    equal(g.restoreGame(clone(game)).results.length, 1);
  });
  test('Puntuación: varios equipos suman; fallos no restan', () => {
    let game = digitalRound(create()); equal(g.scores(game).map(t => t.score), [1, 1]);
    game = digitalRound(g.nextQuestion(game), [['rojo', 'azul'], ['rojo', 'amarillo']]);
    equal(g.scores(game).map(t => t.score), [1, 2]);
    game = digitalRound(g.nextQuestion(game), [['verde', 'azul'], ['verde', 'azul']]);
    equal(g.scores(game).map(t => t.score), [1, 2]);
  });
  test('Doble toque: confirmar, revelar y continuar no duplican turnos ni puntos', () => {
    let game = answer(g.showTurns(create())); assert(g.confirmAnswer(game) === game);
    game = g.reveal(answer(game)); assert(g.reveal(game) === game);
    const next = g.nextQuestion(game); assert(g.nextQuestion(next) === next); equal(next.cursor, 1);
    equal(g.scores(next).map(t => t.score), [1, 1]);
  });
  test('Mazo físico: revelar sin puntuar y consolidar una única vez', () => {
    let game = create('physical'); assert(g.startAnswer(game) === game);
    game = g.reveal(game); equal(game.phase, 'result'); equal(g.scores(game).map(t => t.score), [0, 0]);
    assert(g.nextQuestion(game) === game);
    game = g.togglePhysicalTeam(game, 'team-0'); game = g.togglePhysicalTeam(game, 'team-1');
    game = g.scorePhysical(game); equal(g.scores(game).map(t => t.score), [1, 1]);
    assert(g.scorePhysical(game) === game); assert(g.togglePhysicalTeam(game, 'team-0') === game);
    equal(g.scores(g.restoreGame(clone(game))).map(t => t.score), [1, 1]);
  });
  test('Mazo sin marcador: no necesita nombres y termina', () => {
    let game = create('physical', 2, { scoreboard: false, names: [] }); equal(game.teams, []);
    while (game.phase !== 'finished') game = g.nextQuestion(g.reveal(game));
    equal(g.validRounds(game).length, 2);
  });
  test('Anular: revierte solo la ronda actual una vez y no consume duración', () => {
    let game = g.nextQuestion(digitalRound(create())); game = digitalRound(game);
    game = g.voidQuestion(game); assert(g.voidQuestion(game) === game);
    equal(g.scores(game).map(t => t.score), [1, 1]); equal(g.validRounds(game).length, 1);
    game = g.nextQuestion(game); equal(game.cursor, 2); equal(game.phase, 'question');
  });
  test('Anular antes de confirmar marcador físico no resta puntos previos', () => {
    let game = g.reveal(create('physical')); game = g.togglePhysicalTeam(game, 'team-0');
    game = g.voidQuestion(game); equal(g.scores(game).map(t => t.score), [0, 0]);
    assert(g.scorePhysical(game) === game); equal(g.nextQuestion(game).cursor, 1);
  });
  test('Agotamiento: todas anuladas termina con cero rondas válidas', () => {
    let game = create('solo', 2);
    while (game.phase !== 'finished') game = g.nextQuestion(g.voidQuestion(digitalRound(game)));
    equal(g.validRounds(game).length, 0); equal(g.scores(game)[0].score, 0);
    equal(g.restoreGame(clone(game)).phase, 'finished');
  });
  test('Los tres modos completan una partida sin repeticiones', () => {
    for (const mode of ['physical', 'pass', 'solo']) {
      let game = create(mode); const played = [];
      while (game.phase !== 'finished') {
        played.push(g.currentQuestion(game).id);
        game = mode === 'physical' ? g.scorePhysical(g.reveal(game)) : digitalRound(game);
        game = g.restoreGame(clone(game)); game = g.nextQuestion(game);
      }
      equal(g.validRounds(game).length, 10); equal(new Set(played).size, 10);
    }
  });
  test('Anulaciones se sustituyen sin repetir y se cuentan como vistas', () => {
    let game = create('solo', 12); const played = [];
    while (game.phase !== 'finished') {
      played.push(g.currentQuestion(game).id); game = digitalRound(game);
      if (game.cursor < 2) game = g.voidQuestion(game);
      game = g.nextQuestion(game);
    }
    equal(g.validRounds(game).length, 10); equal(played.length, 12); equal(new Set(played).size, 12);
  });
  test('Filtros combinan categorías OR y dificultad AND; poca oferta limita duración', () => {
    const cat = fixture(); const filters = { categories: ['espana', 'cine'], difficulty: 'facil' };
    assert(filteredQuestions(cat, filters).every(q => ['espana', 'cine'].includes(q.category) && q.difficulty === 'facil'));
    const game = g.createGame(cat, config('solo', filters)); equal(game.target, 4);
    rejects(() => g.createGame(cat, config('solo', { categories: [] })));
    rejects(() => g.createGame(cat, config('solo', { difficulty: 'dificil' })));
  });
  test('Fisher–Yates conserva elementos y prioriza preguntas no vistas', () => {
    const cat = fixture(); const seen = cat.questions.slice(0, 5).map(q => q.id);
    const game = g.createGame(cat, config(), seen, () => .2);
    assert(game.order.slice(0, 7).every(q => !seen.includes(q.id)));
    equal(new Set(game.order.map(q => q.id)).size, 12);
    equal([...g.shuffle([1, 2, 3, 4], () => 0)].sort(), [1, 2, 3, 4]);
  });
  test('Restauración protege selección en curso detrás de pantalla neutral', () => {
    let game = g.toggleColor(g.startAnswer(g.showTurns(create())), 'rojo');
    const restored = g.restoreGame(clone(game)); equal(restored.phase, 'neutral'); equal(restored.selection, ['rojo']);
    game = answer(g.showTurns(create())); equal(g.restoreGame(clone(game)).active, 1);
    equal(g.restoreGame(clone(digitalRound(create()))).phase, 'result');
  });
  test('Instantáneas permiten continuar con catálogo cambiado', () => {
    const game = create('solo'); const cat = fixture(); cat.questions = [];
    const restored = g.restoreGame(clone(game)); equal(restored.order.length, 12);
    equal(digitalRound(restored).phase, 'result');
  });
  test('Restauración rechaza versiones, fases, turnos, puntos y rondas corruptos', () => {
    for (const patch of [{ schemaVersion: 2 }, { cursor: -1 }, { phase: 'unknown' }, { target: 99 },
      { results: [{}] }, { active: 4 }, { selection: ['rojo', 'rojo'] }, { filters: null }]) {
      rejects(() => g.restoreGame({ ...clone(create()), ...patch }));
    }
    const game = digitalRound(create()); game.results[0].correctTeamIds = [];
    rejects(() => g.restoreGame(game));
    const skipped = create(); skipped.answers = { 'team-1': ['rojo', 'amarillo'] }; skipped.active = 1; skipped.phase = 'neutral';
    rejects(() => g.restoreGame(skipped));
  });
  test('Catálogo rechaza duplicados, categorías, colores y aprobación sin fuentes', () => {
    equal(validateCatalog(fixture()), []);
    for (const change of [q => q.id = 'test-1', q => q.category = 'otra', q => q.answerColors = ['rojo', 'rojo'],
      q => q.answerColors = ['dorado'], q => q.sources = [], q => q.reviewedAt = '2026-02-30',
      q => q.prompt = 42, q => q.prompt = ' ', q => q.tags = null]) {
      const cat = fixture(); change(cat.questions[0]); assert(validateCatalog(cat).length > 0);
    }
    const cat = fixture(); cat.questions[1].prompt = `  ${cat.questions[0].prompt.toUpperCase()}  `;
    assert(validateCatalog(cat).length > 0);
  });
  test('Los borradores no entran en partidas', () => {
    const cat = fixture(); cat.questions[0].status = 'draft'; cat.questions[0].sources = []; cat.questions[0].reviewedAt = null;
    equal(validateCatalog(cat), []);
    const game = g.createGame(cat, config()); assert(!game.order.some(q => q.id === 'test-0'));
  });
  test('Nombres de equipo y configuración se validan como texto', () => {
    for (const names of [[''], ['a', ' '.repeat(5)], ['a', 'x'.repeat(25)], ['a', 'b', 'c', 'd', 'e']]) {
      rejects(() => create('pass', 12, { names }));
    }
    equal(create('pass', 12, { names: ['<img src=x>', '  Dos  '] }).teams[0].name, '<img src=x>');
    equal(create().teams.length, 2); equal(create('pass', 12, { names: ['A', 'B', 'C', 'D'] }).teams.length, 4);
    rejects(() => create('solo', 12, { duration: 5 }));
  });
  test('Almacenamiento lleno o inaccesible conserva la partida en memoria y avisa una vez', () => {
    for (const provider of [() => { throw new Error('Denied'); }, () => ({ getItem: () => null, setItem: () => { throw new Error('Quota'); } })]) {
      const warnings = []; const store = createStorage(provider, msg => warnings.push(msg));
      store.saveGame(create('solo')); store.markSeen('test-0'); store.markSeen('test-0');
      assert(store.loadGame().game); equal(store.history(), ['test-0']); equal(warnings.length, 1);
    }
  });
  test('Borrado de historial y partida están separados; corrupción no borra datos ajenos', () => {
    const map = new Map([['another-app', 'keep']]);
    const provider = () => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
    const store = createStorage(provider); store.saveGame(create()); store.markSeen('test-1');
    store.clearHistory(); assert(store.loadGame().game); equal(store.history(), []);
    store.markSeen('test-2'); store.clearGame(); equal(store.history(), ['test-2']);
    equal(map.get('another-app'), 'keep');
    map.set(GAME_KEY, '{bad'); const second = createStorage(provider); assert(second.loadGame().corrupt);
    equal(map.get('another-app'), 'keep'); equal(JSON.parse(map.get(HISTORY_KEY)), ['test-2']);
  });
  return cases;
}
