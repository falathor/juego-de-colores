import { CATEGORIES, loadCatalog } from './catalog.js';
import * as gameLogic from './game.js';
import { createStorage } from './storage.js';
import { el, notice, mount, showDialog, confirmDialog, renderHome, renderSetup, renderGame } from './ui.js';
import { OnlineClient } from './online-client.js';
import { validCode } from './online-game.js';
import { renderOnlineEntry, renderOnlineRoom, inviteLink } from './online-ui.js';

let catalog = null, game = null, corrupt = false, catalogError = '', view = 'home', config;
const storage = createStorage(undefined, notice);
const recovered = storage.loadGame();
game = recovered.game; corrupt = recovered.corrupt;
function defaultConfig(mode = 'physical') {
  return { mode, categories: CATEGORIES.map(c => c.id), difficulty: 'todas', duration: 20,
    scoreboard: false, names: ['Equipo 1', 'Equipo 2'] };
}
config = defaultConfig();
let onlineName = '', onlineCode = '', onlineBusy = false, onlineState = null, selection = [], selectionRound = null;
const online = new OnlineClient({ onNotice: notice, onState: state => {
  const changed = JSON.stringify(onlineState) !== JSON.stringify(state);
  onlineState = state;
  if (!state) { view = 'online'; notice('Has salido de la sala.'); render(); return; }
  if (selectionRound !== state.round || state.ownAnswer) { selection = []; selectionRound = state.round; }
  if (view === 'online-room' && changed) renderOnlineUpdate();
} });
function renderOnlineUpdate() {
  // Polling preserves keyboard focus and scroll; unchanged snapshots do not replace controls.
  const active = document.activeElement;
  const focus = active?.id, x = window.scrollX, y = window.scrollY;
  render(focus); window.scrollTo(x, y);
}
async function runOnline(operation) {
  if (onlineBusy) return;
  onlineBusy = true;
  try { await operation(); }
  catch (error) { notice(error.message); }
  finally { onlineBusy = false; render(); }
}
function enterOnline(code) {
  if (code && !validCode(code)) { notice('Introduce un código de cuatro dígitos.'); return; }
  if (online.session) {
    confirmDialog('Sustituir la sesión guardada', 'Entrar en otra sala hará que pierdas el acceso a tu sesión anterior. Si eras anfitrión, vuelve primero y cierra esa sala.',
      () => { online.clear(); enterOnline(code); }, 'Entrar en otra sala'); return;
  }
  runOnline(async () => {
    await online.enter(code, onlineName.trim(), code ? undefined : config);
    selectionRound = null; selection = []; onlineState = online.state; view = 'online-room';
  });
}
function joinOnline() { if (!validCode(onlineCode)) { notice('Introduce un código de cuatro dígitos.'); return; } enterOnline(onlineCode); }
function resumeOnline() { view = 'online-room'; onlineState = online.state; render(); runOnline(() => online.resume()); }
function onlineAction(action, extra = {}) {
  if (action === 'askVoid') { confirmDialog('¿Anular esta pregunta?', 'Se retirarán los puntos de esta ronda en todos los dispositivos y se buscará una pregunta sustituta.', () => onlineAction('void'), 'Anular pregunta'); return; }
  runOnline(() => online.action(action, extra));
}
function editOnlineName() {
  const input = el('input', { type: 'text', id: 'edit-online-name', maxlength: '24', autocomplete: 'nickname' });
  input.value = onlineState.players.find(p => p.id === onlineState.myId).name;
  showDialog('Cambiar tu nombre', [el('label', { for: 'edit-online-name' },
    el('span', { class: 'field-label', text: 'Tu nombre' }), input),
    el('p', { text: 'Entre 1 y 24 caracteres. Los demás jugadores verán tu nuevo nombre.' })], [
    { label: 'Cancelar', className: 'secondary', action: () => {} },
    { label: 'Guardar nombre', action: () => onlineAction('rename', { name: input.value }) },
  ]);
  input.focus(); input.select();
}
function leaveOnline() {
  const host = onlineState?.myId === onlineState?.hostId;
  confirmDialog(host ? 'Cerrar la sala' : 'Salir de la sala', host ? 'La sala se cerrará para todos los jugadores.' : onlineState?.phase === 'lobby' ? 'Saldrás de la sala de espera.' : 'Tu sesión seguirá guardada para que puedas volver a esta partida.', () => {
    if (host || onlineState?.phase === 'lobby') runOnline(async () => { await online.action(host ? 'close' : 'leave'); view = 'home'; });
    else { online.pause(); view = 'home'; render(); }
  }, host ? 'Cerrar sala' : 'Salir');
}
async function copyInvite() {
  try { await navigator.clipboard.writeText(inviteLink(onlineState.code)); notice('Enlace copiado. Compártelo con los demás jugadores.'); }
  catch { notice('No se pudo copiar automáticamente. Selecciona y copia el enlace que aparece en la sala.'); }
}
function render(focusId) {
  const content = view === 'online' ? renderOnlineEntry({ name: onlineName, code: onlineCode,
    update: patch => { if ('name' in patch) onlineName = patch.name; if ('code' in patch) onlineCode = patch.code; },
    create: () => { config = defaultConfig('online'); view = 'online-setup'; render(); }, join: joinOnline,
    resume: online.session ? resumeOnline : null, forget: () => confirmDialog('Olvidar sesión', 'Perderás el acceso a esta sesión. La sala no se cerrará.', () => { online.clear(); onlineState = null; render(); }, 'Olvidar sesión'), back: home, busy: onlineBusy })
    : view === 'online-room' ? onlineState ? renderOnlineRoom({ state: onlineState, selection, busy: onlineBusy,
      toggle: id => {
        if (onlineState.ownAnswer || onlineBusy) return;
        if (selection.includes(id)) selection = selection.filter(c => c !== id);
        else if (selection.length < onlineState.question.required) selection = [...selection, id];
        else { notice(`Solo puedes elegir ${onlineState.question.required} colores. Quita uno para cambiarlo.`); return; }
        render(`color-${id}`);
      }, action: onlineAction, leave: leaveOnline, copy: copyInvite, rename: editOnlineName,
      reveal: () => onlineState.allAnswered ? onlineAction('reveal') : confirmDialog('Cerrar la ronda', 'Quienes todavía no han respondido obtendrán cero puntos. La solución se mostrará a todos.', () => onlineAction('reveal', { force: true }), 'Cerrar y revelar'),
    }) : el('section', { class: 'panel' }, el('h1', { text: 'Conectando con la sala…', 'data-heading': '', tabindex: '-1' }),
      el('button', { type: 'button', class: 'secondary', text: 'Volver', onClick: () => { online.pause(); view = 'online'; render(); } }))
    : view === 'online-setup' ? renderSetup({ catalog, config, seen: [],
      update: (patch, focus) => { Object.assign(config, patch); render(focus); }, start: () => enterOnline(), back: () => { view = 'online'; render(); } })
    : view === 'setup' ? renderSetup({ catalog, config, seen: storage.history(),
    update: (patch, focus) => { Object.assign(config, patch); render(focus); }, start, back: home })
    : view === 'game' && game ? renderGame({ game, transition, home })
    : renderHome({ catalog, game, corrupt, error: catalogError, configure, resume: () => {
      view = 'game'; render();
    }, discard: () => confirmDialog('Borrar la partida dañada', 'Se borrará únicamente la partida guardada. El historial se conservará.', () => {
      storage.clearGame(); corrupt = false; render();
    }, 'Borrar partida'), retry: initialize, onlineResume: online.session ? resumeOnline : null });
  mount(content, focusId);
}
function home() { if (view === 'online-room' && onlineState) { leaveOnline(); return; } online.pause(); view = 'home'; render(); }
function configure(mode) { if (!catalog) return; if (mode === 'online') { view = 'online'; render(); return; } config = defaultConfig(mode); view = 'setup'; render(); }
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
    'En línea: crea una sala y comparte su código de cuatro dígitos o el enlace. Cada persona responde en su dispositivo. El anfitrión inicia, revela y avanza las rondas.',
  ].map(text => el('li', { text }))),
  el('p', { text: 'Un conjunto completo correcto suma 1 punto. El orden no importa. No hay puntos parciales ni penalizaciones. Los empates son victorias compartidas.' }),
  el('p', { text: 'Si una pregunta es discutible, anuladla antes de avanzar. Se retirarán sus puntos y se buscará una sustituta. Esta puntuación es una variante digital propia; con cartas podéis seguir el reglamento de vuestra caja fuera de la app.' }),
  el('p', { text: 'Las salas admiten 2–8 personas y duran hasta seis horas. Las respuestas confirmadas no pueden cambiarse. Si faltan respuestas, el anfitrión puede cerrar la ronda: quienes no respondieron reciben cero puntos. La sincronización puede tardar unos segundos.' }),
]));
document.getElementById('about').addEventListener('click', () => showDialog('Acerca de ¿De qué color?', [
  el('p', { text: 'Proyecto independiente inspirado en juegos de preguntas con colores. Sin afiliación con Mercurio ni Big Potato.' }),
  el('p', { text: 'Preguntas originales, sin cuentas, anuncios ni analítica. Las partidas con cartas y pasando el móvil se guardan en este navegador. En línea, Cloudflare guarda temporalmente los nombres, las respuestas y el progreso de la sala durante un máximo de seis horas. La clave privada de tu sesión queda en este navegador y no se comparte en el enlace.' }),
  el('p', { text: 'Los tonos de pantalla pueden diferir de vuestras cartas. Hace falta conexión para cargar y jugar en línea. El catálogo es público; jugad de buena fe.' }),
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
const invite = new URL(location.href).searchParams.get('sala');
if (validCode(invite)) {
  onlineCode = invite;
  // Remove the invite after opening so returning to Inicio does not rejoin on reload.
  history.replaceState(null, '', location.pathname);
  if (online.session?.code === invite) resumeOnline();
  else { view = 'online'; render(); enterOnline(invite); }
}
