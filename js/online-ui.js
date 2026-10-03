import { CATEGORIES, DIFFICULTIES } from './catalog.js';
import { el, colorPicker, colorTags, scoreRows, answerLabel } from './ui.js';

const p = (text, className = '') => el('p', { text, class: className });
const button = (text, onClick, className = 'secondary', disabled = false) => el('button', { type: 'button', text, onClick, class: className, disabled });
const heading = (text, className = '') => el('h1', { text, class: className, tabindex: '-1', 'data-heading': '' });
export function inviteLink(code) { const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('sala', code); return url.href; }
export function renderOnlineEntry({ name, code, update, create, join, resume, forget, back, busy }) {
  const nameInput = el('input', { id: 'online-name', type: 'text', maxlength: '24', autocomplete: 'nickname', onInput: e => update({ name: e.target.value }) });
  nameInput.value = name;
  const codeInput = el('input', { id: 'room-code', type: 'text', inputmode: 'numeric', pattern: '[0-9]{4}', maxlength: '4', autocomplete: 'off', onInput: e => update({ code: e.target.value }) });
  codeInput.value = code;
  const form = el('form', { class: 'panel setup-panel' },
    el('label', { for: 'online-name' }, p('Tu nombre (opcional)', 'field-label'), nameInput),
    el('label', { for: 'room-code' }, p('Código de cuatro dígitos', 'field-label'), codeInput),
    button('Unirme a la sala', join, 'primary', busy), button('Crear una sala', create, 'secondary', busy));
  form.addEventListener('submit', e => { e.preventDefault(); join(); });
  return el('section', { class: 'setup-view' }, button('← Volver', back, 'back'), heading('Jugar en línea'),
    p('Entrad cada uno desde vuestro dispositivo. El anfitrión crea la sala y comparte el código o el enlace.'),
    resume ? el('div', { class: 'resume' }, button('Volver a la sala', resume, 'primary'), button('Olvidar sesión', forget, 'text-button')) : null, form);
}
function members(state) {
  return el('ul', { class: 'room-members', 'aria-label': 'Jugadores de la sala' }, state.players.map(player => el('li', {},
    el('strong', { text: player.name }), el('span', { text: `${player.id === state.hostId ? 'Anfitrión · ' : ''}${state.phase === 'lobby' ? (player.online ? 'Conectado' : 'Reconectando') : player.submitted ? 'Respuesta guardada' : 'Pendiente'}` }))));
}
export function renderOnlineRoom({ state, selection, toggle, action, reveal, leave, copy, rename, busy }) {
  const host = state.myId === state.hostId;
  const profile = el('div', { class: 'resume' }, p(`Juegas como ${state.players.find(p => p.id === state.myId).name}`),
    button('Cambiar mi nombre', rename, 'secondary', busy));
  const exit = button(host ? 'Cerrar sala' : 'Salir de la sala', leave, 'text-button', busy);
  if (state.phase === 'lobby') return el('section', { class: 'setup-view' }, heading('Sala de espera'), profile,
    el('div', { class: 'panel setup-panel' }, p('CÓDIGO DE LA SALA', 'eyebrow'),
      el('strong', { class: 'room-code', text: state.code }), p('2–8 jugadores. Comparte el código o este enlace para que entren directamente.'),
      el('a', { href: inviteLink(state.code), text: inviteLink(state.code), class: 'invite-link' }),
      button('Copiar enlace', copy), members(state),
      p(`${state.target} rondas · ${DIFFICULTIES[state.config.difficulty] || 'Todas las dificultades'}`),
      host ? button('Empezar partida', () => action('start'), 'primary', busy || state.players.length < 2) : p('El anfitrión iniciará la partida cuando estéis todos.')), exit);
  if (state.phase === 'finished') {
    const top = Math.max(...state.players.map(p => p.score)), winners = state.players.filter(p => p.score === top).map(p => p.name);
    return el('section', { class: 'panel final-panel' }, p('FIN DE LA PARTIDA', 'eyebrow'),
      heading(winners.length > 1 ? '¡Victoria compartida!' : `¡Gana ${winners[0]}!`), p(winners.join(' · ')), profile,
      p(`${state.completed} rondas válidas jugadas.`), state.completed < state.target ? p('Se han agotado las preguntas disponibles para sustituir las anuladas.') : null,
      scoreRows(state.players), exit);
  }
  const q = state.question, category = CATEGORIES.find(c => c.id === q.category);
  const result = state.phase === 'result';
  const panel = el('div', { class: 'panel question-panel' }, el('div', { class: 'question-meta' },
    el('span', { class: 'badge', text: `${category.icon} ${category.label}` }), el('span', { class: 'badge', text: DIFFICULTIES[q.difficulty] })), heading(q.prompt, 'question-text'));
  if (!result) {
    panel.append(p(`Elige ${q.required} ${q.required === 1 ? 'color' : 'colores'}.`, 'required'));
    if (!state.ownAnswer) panel.append(colorPicker(selection, toggle),
      p(`${selection.length} de ${q.required} colores seleccionados`, 'selection-count'),
      el('div', { class: 'game-actions' }, button('Confirmar respuesta', () => action('answer', { colors: selection }), 'primary', busy || selection.length !== q.required)));
    else panel.append(p(`Tu respuesta está guardada: ${answerLabel(state.ownAnswer)}. Espera a que el anfitrión revele la solución.`, 'hint'));
    panel.append(members(state));
    if (host) panel.append(el('div', { class: 'game-actions' }, button(state.allAnswered ? 'Revelar solución' : 'Cerrar ronda y revelar', reveal, 'primary', busy)));
  } else {
    panel.append(p('LA SOLUCIÓN', 'eyebrow'), colorTags(q.answerColors), p(q.explanation, 'explanation'));
    if (state.result.void) panel.append(p('Pregunta anulada. Sus puntos se han retirado; se buscará una sustituta.', 'void-note'));
    panel.append(scoreRows(state.players, { ...state.result, correctTeamIds: state.result.correctIds }));
    if (host) panel.append(el('div', { class: 'game-actions' }, !state.result.void ? button('Anular pregunta', () => action('askVoid'), 'text-button', busy) : null,
      button(state.completed >= state.target ? 'Ver resultado final' : 'Siguiente pregunta →', () => action('next'), 'primary', busy)));
    else panel.append(p('El anfitrión pasará a la siguiente ronda.', 'hint'));
    panel.append(el('details', { class: 'sources' }, el('summary', { text: 'Consultar las fuentes de esta pregunta' }),
      q.sources.map(s => el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.title }))));
  }
  return el('section', { class: 'game-view' }, profile, el('div', { class: 'game-top' }, p(`Sala ${state.code}`),
    el('strong', { text: `Ronda ${Math.min(state.completed + (result && !state.result.void ? 0 : 1), state.target)} de ${state.target}` })), panel, exit);
}
