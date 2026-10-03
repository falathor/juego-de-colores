import { CATEGORIES, loadCatalog } from './catalog.js';
import * as gameLogic from './game.js';
import { createStorage } from './storage.js';
import { el, notice, mount, showDialog, confirmDialog, renderHome, renderSetup, renderGame } from './ui.js';

let catalog = null, game = null, corrupt = false, catalogError = '', view = 'home', config;
const storage = createStorage(undefined, notice);
const recovered = storage.loadGame();
game = recovered.game; corrupt = recovered.corrupt;
function defaultConfig(mode = 'physical') {
  return { mode, categories: CATEGORIES.map(c => c.id), difficulty: 'todas', duration: 20,
    scoreboard: false, names: ['Equipo 1', 'Equipo 2'] };
}
config = defaultConfig();
function render(focusId) {
  const content = view === 'setup' ? renderSetup({ catalog, config, seen: storage.history(),
    update: (patch, focus) => { Object.assign(config, patch); render(focus); }, start, back: home })
    : view === 'game' && game ? renderGame({ game, transition, home })
    : renderHome({ catalog, game, corrupt, error: catalogError, configure, resume: () => {
      view = 'game'; render();
    }, discard: () => confirmDialog('Borrar la partida dañada', 'Se borrará únicamente la partida guardada. El historial se conservará.', () => {
      storage.clearGame(); corrupt = false; render();
    }, 'Borrar partida'), retry: initialize });
  mount(content, focusId);
}
function home() { view = 'home'; render(); }
function configure(mode) { if (!catalog) return; config = defaultConfig(mode); view = 'setup'; render(); }
function persist() {
  storage.saveGame(game);
  storage.markSeen(gameLogic.currentQuestion(game).id);
}
function start() {
  const begin = () => {
    try {
      game = gameLogic.createGame(catalog, config, storage.history()); corrupt = false;
      persist(); view = 'game'; render();
    } catch (error) { notice(error.message); }
  };
  if (game && game.phase !== 'finished') confirmDialog('Empezar una nueva partida',
    'La partida que tenías guardada se sustituirá por esta. El historial de preguntas vistas se conservará.', begin, 'Empezar nueva');
  else begin();
}
function transition(action, value) {
  if (action === 'again') {
    if (!catalog) { home(); return; }
    config = { ...defaultConfig(game.mode), ...game.filters, duration: game.requestedDuration,
      scoreboard: game.mode === 'physical' && game.teams.length > 0,
      names: game.teams.length >= 2 ? game.teams.map(t => t.name) : ['Equipo 1', 'Equipo 2'] };
    view = 'setup'; render(); return;
  }
  if (action === 'askVoid') {
    confirmDialog('¿Anular esta pregunta?', 'La ronda no contará y se retirarán sus puntos. Intentaremos sustituirla por otra pregunta.',
      () => transition('voidQuestion'), 'Anular pregunta'); return;
  }
  const operation = gameLogic[action];
  if (typeof operation !== 'function') return;
  const next = operation(game, value);
  if (next === game) {
    if (action === 'toggleColor' && game.phase === 'answering' && !game.selection.includes(value)) {
      const required = gameLogic.currentQuestion(game).answerColors.length;
      notice(`Solo puedes elegir ${required} ${required === 1 ? 'color' : 'colores'}. Quita uno para cambiarlo.`);
    }
    return;
  }
  game = next; persist();
  if (!storage.volatile) notice('');
  const focus = action === 'toggleColor' ? `color-${value}` : action === 'togglePhysicalTeam' ? `physical-${value}` : null;
  render(focus);
}
document.getElementById('home').addEventListener('click', home);
document.getElementById('instructions').addEventListener('click', () => showDialog('Cómo se juega', [
  el('p', { text: 'Todas las respuestas son uno o varios colores distintos. La pregunta indica cuántos necesitas.' }),
  el('ol', {}, ...[
    'Con cartas: elegid las cartas físicas, revelad la respuesta y pasad a la siguiente. Podéis activar un marcador de 2–4 equipos.',
    'Pasa el móvil: leed juntos la pregunta. Cada equipo recibe el dispositivo, elige sus colores y confirma sin que los demás miren. Revelad cuando todos hayan respondido.',
    'Individual: elige los colores y confirma para descubrir si has acertado.',
  ].map(text => el('li', { text }))),
  el('p', { text: 'Un conjunto completo correcto suma 1 punto. El orden no importa. No hay puntos parciales ni penalizaciones. Los empates son victorias compartidas.' }),
  el('p', { text: 'Si una pregunta es discutible, anuladla antes de avanzar. Se retirarán sus puntos y se buscará una sustituta. Esta puntuación es una variante digital propia; con cartas podéis seguir el reglamento de vuestra caja fuera de la app.' }),
  el('p', { text: 'Jugad con una sola pantalla compartida. Abrir la URL en otros móviles crea partidas independientes.' }),
]));
document.getElementById('about').addEventListener('click', () => showDialog('Acerca de ¿De qué color?', [
  el('p', { text: 'Proyecto independiente inspirado en juegos de preguntas con colores. Sin afiliación con Mercurio ni Big Potato.' }),
  el('p', { text: 'Preguntas originales, sin cuentas, anuncios ni analítica. La partida y el historial se guardan únicamente en este navegador. Las respuestas son públicas; los turnos privados están pensados para jugar de buena fe.' }),
  el('p', { text: 'Los tonos de pantalla son una convención de esta app y pueden diferir de los de vuestras cartas. La primera versión necesita conexión para cargar y no sincroniza dispositivos.' }),
]));
document.getElementById('settings').addEventListener('click', () => showDialog('Ajustes', [
  el('p', { text: `${storage.history().length} preguntas vistas en este navegador.` }),
  el('button', { type: 'button', class: 'secondary settings-action', text: 'Borrar historial de preguntas vistas', onClick: () => {
    document.getElementById('dialog').close();
    confirmDialog('Borrar historial', 'Las próximas partidas dejarán de priorizar las preguntas nuevas. Tu partida actual se conservará.', () => {
      storage.clearHistory(); if (!storage.volatile) notice('Historial de preguntas vistas borrado.'); render();
    }, 'Borrar historial');
  } }),
  el('button', { type: 'button', class: 'danger settings-action', text: 'Borrar partida guardada', disabled: !game && !corrupt, onClick: () => {
    document.getElementById('dialog').close();
    confirmDialog('Borrar partida guardada', 'Se perderá el progreso de esta partida. El historial de preguntas vistas se conservará.', () => {
      storage.clearGame(); game = null; corrupt = false; home();
      if (!storage.volatile) notice('Partida guardada borrada.');
    }, 'Borrar partida');
  } }),
  el('p', { text: storage.volatile ? 'Este navegador no permite guardar. Puedes seguir jugando mientras no cierres la página.' : 'El guardado es automático después de cada paso.' }),
]));
async function initialize() {
  catalogError = '';
  try { catalog = await loadCatalog(); }
  catch { catalogError = 'No se han podido cargar las preguntas. Comprueba la conexión y abre la app desde un servidor web.'; }
  render();
}
await initialize();
