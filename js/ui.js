import { COLORS, CATEGORIES, DIFFICULTIES, filteredQuestions } from './catalog.js';
import { currentQuestion, validRounds, scores } from './game.js';

// All catalogue and player text enters the DOM through textContent.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key === 'onClick') node.addEventListener('click', value);
    else if (key === 'onChange') node.addEventListener('change', value);
    else if (key === 'onInput') node.addEventListener('input', value);
    else if (key === 'disabled' || key === 'checked') node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) if (child != null) node.append(child);
  return node;
}
const text = (tag, value, className) => el(tag, { text: value, ...(className ? { class: className } : {}) });
const button = (label, action, className = 'secondary', attrs = {}) => el('button', {
  type: 'button', class: className, text: label, onClick: action, ...attrs,
});
const heading = (label, tag = 'h1', className = '') => el(tag, { text: label, tabindex: '-1', 'data-heading': '', class: className });
const modeNames = { physical: 'Jugar con cartas', pass: 'Pasa el móvil', solo: 'Individual', online: 'Jugar en línea' };
export function notice(message) {
  const node = document.getElementById('notice');
  node.textContent = message;
  node.hidden = !message;
}
export function mount(content, focusId = null) {
  document.getElementById('main').replaceChildren(content);
  const focused = focusId && document.getElementById(focusId);
  (focused || document.querySelector('[data-heading]'))?.focus({ preventScroll: Boolean(focused) });
  if (!focused) window.scrollTo({ top: 0, behavior: 'instant' });
}
export function showDialog(title, children, actions = []) {
  const dialog = document.getElementById('dialog');
  const previous = document.activeElement;
  const close = () => dialog.close();
  dialog.replaceChildren(button('×', close, 'dialog-close', { 'aria-label': 'Cerrar' }),
    el('h2', { id: 'dialog-title', text: title }), ...children,
    el('div', { class: 'dialog-actions' }, actions.length ? actions.map(a => button(a.label, () => {
      close(); a.action();
    }, a.className || 'primary')) : button('Entendido', close, 'primary')));
  if (!dialog.open) dialog.showModal();
  dialog.addEventListener('close', () => previous?.isConnected && previous.focus(), { once: true });
}
export function confirmDialog(title, message, action, label = 'Confirmar') {
  showDialog(title, [text('p', message)], [
    { label: 'Cancelar', className: 'secondary', action: () => {} },
    { label, className: 'danger', action },
  ]);
}
export function renderHome({ catalog, game, corrupt, error, configure, resume, discard, retry, onlineResume }) {
  const root = el('div', { class: 'home-view' });
  const title = heading('');
  title.append('¿De qué ', el('span', { class: 'color-word', text: 'color' }), '?');
  root.append(el('section', { class: 'home-intro' }, text('p', 'PONLE COLOR A LA SOBREMESA', 'eyebrow'),
    title, text('p', 'Todas las respuestas son colores.')));
  if (game) root.append(el('div', { class: 'resume' },
    text('p', `Tu partida de «${modeNames[game.mode]}» está ${game.phase === 'finished' ? 'terminada' : 'guardada'}.`),
    button(game.phase === 'finished' ? 'Ver resumen' : 'Continuar partida', resume, 'primary')));
  if (corrupt) root.append(el('div', { class: 'resume' },
    text('p', 'La partida guardada está dañada. Puedes borrarla e iniciar una nueva.'),
    button('Borrar partida dañada', discard)));
  if (onlineResume) root.append(el('div', { class: 'resume' }, text('p', 'Tienes una sesión de juego en línea guardada.'),
    button('Volver a la sala', onlineResume, 'primary')));
  const modeCards = [
    ['physical', 'Jugar con cartas', 'Sacad vuestras cartas de colores. Nosotros ponemos las preguntas.', '2 o más personas · Mazo físico', 'cards'],
    ['pass', 'Pasa el móvil', 'Un solo dispositivo, varios equipos. Cada respuesta, en secreto.', '2–4 equipos · Sin cartas', '⇄'],
    ['online', 'Jugar en línea', 'Cada persona en su dispositivo. Compartid un código o un enlace.', '2–8 personas · Una misma partida', '↗'],
  ];
  root.append(el('div', { class: 'mode-grid' }, modeCards.map(([mode, label, description, detail, art]) => {
    const illustration = el('span', { class: 'mode-art', 'aria-hidden': 'true' });
    illustration.append(art === 'cards' ? el('span', { class: 'mini-cards' }, el('i'), el('i')) : art);
    return el('button', { type: 'button', class: 'mode-card', onClick: () => configure(mode), disabled: !catalog },
      illustration, text('h2', label), text('p', description),
      el('span', { class: 'mode-bottom' }, text('span', detail), el('span', { class: 'arrow', text: '↗', 'aria-hidden': 'true' })));
  })));
  if (error) root.append(text('p', error, 'catalog-error'), button('Volver a cargar preguntas', retry, 'secondary wide'));
  const count = catalog?.questions.filter(q => q.status === 'approved').length || 0;
  root.append(el('div', { class: 'facts' }, [count ? `${count} preguntas` : 'Preguntas originales', '8 categorías', 'Sin prisas ni cronómetro'].map(f => text('span', f))));
  return root;
}
export function renderSetup({ catalog, config, seen, update, start, back }) {
  const root = el('section', { class: 'setup-view' });
  root.append(button('← Volver', back, 'back'), el('div', { class: 'setup-title' },
    text('p', 'PREPARAD LA PARTIDA', 'eyebrow'), heading(modeNames[config.mode]),
    text('p', config.mode === 'physical' ? 'Jugad con vuestras cartas y revelad la solución juntos.'
      : config.mode === 'pass' ? 'Responded por turnos, pasando un único dispositivo.' : config.mode === 'online' ? 'Crea una sala e invita a los demás desde sus dispositivos.' : 'Un reto de memoria, color a color.')));
  const panel = el('div', { class: 'panel setup-panel' });
  const categoryButtons = CATEGORIES.map(c => button('', () => {
    const categories = config.categories.includes(c.id) ? config.categories.filter(id => id !== c.id) : [...config.categories, c.id];
    update({ categories }, `category-${c.id}`);
  }, 'chip', { id: `category-${c.id}`, 'aria-pressed': String(config.categories.includes(c.id)) }));
  categoryButtons.forEach((b, i) => b.append(text('span', CATEGORIES[i].icon), text('span', CATEGORIES[i].label),
    el('span', { class: 'check', text: config.categories.includes(CATEGORIES[i].id) ? '✓' : '+', 'aria-hidden': 'true' })));
  panel.append(el('fieldset', {}, text('legend', 'Categorías'),
    el('div', { class: 'legend-row' }, text('p', 'Podéis elegir varias.', 'field-note'),
      button(config.categories.length === CATEGORIES.length ? 'Quitar todas' : 'Seleccionar todas', () => update({ categories: config.categories.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.id) }, 'all-categories'), 'text-button', { id: 'all-categories' })),
    el('div', { class: 'category-grid' }, categoryButtons)));
  function selectField(label, id, value, options, onChange) {
    const select = el('select', { id, onChange: e => onChange(e.target.value) },
      options.map(([key, name]) => el('option', { value: key, text: name })));
    select.value = String(value);
    return el('label', { for: id }, text('span', label, 'field-label'), select);
  }
  panel.append(el('div', { class: 'form-row' },
    selectField('Dificultad', 'difficulty', config.difficulty, [['todas', 'Todas'], ...Object.entries(DIFFICULTIES)], value => update({ difficulty: value }, 'difficulty')),
    selectField('Duración', 'duration', config.duration, [10, 20, 30].map(n => [n, `${n} preguntas`]), value => update({ duration: Number(value) }, 'duration'))));
  if (config.mode === 'physical') panel.append(el('label', { class: 'checkbox-label' },
    el('input', { type: 'checkbox', id: 'scoreboard', checked: config.scoreboard, onChange: e => update({ scoreboard: e.target.checked }, 'scoreboard') }),
    'Llevar el marcador de equipos'));
  if (config.mode === 'pass' || (config.mode === 'physical' && config.scoreboard)) {
    const teams = el('fieldset', {}, text('legend', 'Equipos'),
      selectField('Número de equipos', 'team-count', config.names.length, [2, 3, 4].map(n => [n, `${n} equipos`]), value => {
        update({ names: Array.from({ length: Number(value) }, (_, i) => config.names[i] ?? `Equipo ${i + 1}`) }, 'team-count');
      }));
    teams.append(el('div', { class: 'team-inputs' }, config.names.map((name, i) => {
      const input = el('input', { type: 'text', id: `name-${i}`, maxlength: '24', required: '', autocomplete: 'off',
        onInput: e => { config.names[i] = e.target.value; refreshAvailability(); } });
      input.value = name;
      return el('label', { for: `name-${i}` }, `Nombre del equipo ${i + 1}`, input);
    })));
    panel.append(teams);
  }
  const available = text('p', '', 'availability');
  available.id = 'availability';
  available.setAttribute('aria-live', 'polite');
  const startButton = button(config.mode === 'online' ? 'Crear sala →' : 'Empezar partida →', start, 'primary', { id: 'start-game', 'aria-describedby': 'availability' });
  function refreshAvailability() {
    const questions = filteredQuestions(catalog, config);
    const count = questions.length;
    const fresh = questions.filter(q => !seen.includes(q.id)).length;
    const target = Math.min(config.duration, count);
    available.textContent = !count ? 'No hay preguntas con estos filtros. Selecciona categorías o quita la dificultad.'
      : count < config.duration ? `Hay ${count} preguntas disponibles con estos filtros. La partida tendrá ${count} rondas.`
      : `${count} preguntas disponibles · ${target} rondas en esta partida.`;
    if (count && fresh < target) available.append(` Se reutilizarán ${target - fresh} preguntas de partidas anteriores.`);
    const needsNames = config.mode === 'pass' || (config.mode === 'physical' && config.scoreboard);
    startButton.disabled = !count || (needsNames && config.names.some(n => !n.trim() || n.trim().length > 24));
  }
  refreshAvailability();
  root.append(panel, el('div', { class: 'setup-bottom' }, available, startButton));
  return root;
}
export function solutionTextColor(hex) {
  const luminance = value => {
    const [r, g, b] = value.slice(1).match(/../g).map(c => parseInt(c, 16) / 255)
      .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const background = luminance(hex);
  const dark = COLORS.find(c => c.id === 'negro').hex;
  const light = COLORS.find(c => c.id === 'blanco').hex;
  const contrast = foreground => (Math.max(background, luminance(foreground)) + .05)
    / (Math.min(background, luminance(foreground)) + .05);
  return contrast(dark) >= contrast(light) ? dark : light;
}
export function colorTags(ids) {
  return el('div', { class: 'solution-colors' }, COLORS.filter(c => ids.includes(c.id)).map(c =>
    el('div', { class: 'solution-card', style: `--swatch:${c.hex};--solution-ink:${solutionTextColor(c.hex)}` },
      el('strong', { text: c.label }))));
}
export function answerLabel(ids) { return COLORS.filter(c => ids?.includes(c.id)).map(c => c.label).join(' + '); }
function scoreList(game, round = null) {
  return scoreRows(scores(game), round);
}
export function scoreRows(players, round = null) {
  return el('div', { class: 'score-list' }, players.map(team => {
    const details = el('div', {}, text('div', team.name, 'team-name'));
    if (round && !round.void) {
      const correct = round.correctTeamIds.includes(team.id);
      details.append(text('div', `${correct ? '✓ Acierto · +1 punto' : '× Sin acierto · +0 puntos'}`, `result-label${correct ? '' : ' wrong'}`));
      if (round.answers[team.id]) details.append(text('div', answerLabel(round.answers[team.id]), 'team-detail'));
    }
    return el('div', { class: 'score-row' }, details,
      el('div', { class: 'score-number' }, String(team.score), text('span', ' pts', 'small-unit')));
  }));
}
export function colorPicker(selection, toggle) {
  return el('div', { class: 'color-grid', role: 'group', 'aria-label': 'Colores de tu respuesta' }, COLORS.map(c =>
    button('', () => toggle(c.id), 'color-button', {
      id: `color-${c.id}`, 'aria-pressed': String(selection.includes(c.id)), 'aria-label': c.label,
    })).map((b, i) => {
      b.append(el('span', { class: 'swatch', style: `--swatch:${COLORS[i].hex}`, 'aria-hidden': 'true' }), text('span', COLORS[i].label),
        el('span', { class: 'selection-mark', text: selection.includes(COLORS[i].id) ? '✓' : '', 'aria-hidden': 'true' }));
      return b;
    }));
}
export function renderGame({ game, transition, home }) {
  if (game.phase === 'finished') return renderFinal({ game, home, again: () => transition('again') });
  const root = el('section', { class: 'game-view' });
  const roundNumber = Math.min(validRounds(game).length + (game.phase === 'result' && game.results.at(-1).scored && !game.results.at(-1).void ? 0 : 1), game.target);
  root.append(el('div', { class: 'game-top' }, text('span', modeNames[game.mode]), text('strong', `Ronda ${roundNumber} de ${game.target}`)),
    el('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Rondas válidas completadas', 'aria-valuemin': '0',
      'aria-valuemax': String(game.target), 'aria-valuenow': String(validRounds(game).length) },
    el('div', { class: 'progress-fill', style: `width:${validRounds(game).length / game.target * 100}%` })));
  if (game.phase === 'neutral' || game.phase === 'ready') {
    const ready = game.phase === 'ready';
    root.append(el('div', { class: 'panel neutral-panel' },
      el('div', { class: 'neutral-symbol', text: ready ? '✓' : '⇄', 'aria-hidden': 'true' }),
      text('p', ready ? 'TODAS LAS RESPUESTAS GUARDADAS' : 'PASAD EL DISPOSITIVO', 'eyebrow'),
      heading(ready ? 'Ahora, todos juntos' : `Turno de ${game.teams[game.active].name}`),
      text('p', ready ? 'Ya podéis descubrir la solución y comparar vuestras elecciones.'
        : 'Cuando tengas el móvil, empieza tu respuesta. Los demás, sin mirar.'),
      button(ready ? 'Ver respuestas' : 'Empezar respuesta', () => transition(ready ? 'reveal' : 'startAnswer'), 'primary')));
    return root;
  }
  const q = currentQuestion(game);
  const category = CATEGORIES.find(c => c.id === q.category);
  const result = game.phase === 'result';
  const panel = el('div', { class: 'panel question-panel' },
    el('div', { class: 'question-meta' }, text('span', `${category.icon} ${category.label}`, 'badge'),
      text('span', DIFFICULTIES[q.difficulty], 'badge'),
      game.phase === 'answering' ? text('span', game.teams[game.active].name, 'badge soft') : null),
    heading(q.prompt, 'h1', 'question-text'));
  if (!result) panel.append(el('p', { class: 'required' }, text('span', String(q.answerColors.length)),
    text('span', `${game.phase === 'answering' ? 'Elige' : 'La respuesta tiene'} ${q.answerColors.length} ${q.answerColors.length === 1 ? 'color' : 'colores'}${game.phase === 'answering' ? '' : q.answerColors.length === 1 ? ' distinto' : ' distintos'}.`)));
  if (game.phase === 'answering') {
    panel.append(colorPicker(game.selection, id => transition('toggleColor', id)), el('p', { class: 'selection-count', 'aria-live': 'polite', text: `${game.selection.length} de ${q.answerColors.length} ${q.answerColors.length === 1 ? 'color seleccionado' : 'colores seleccionados'}` }),
      el('div', { class: 'game-actions' }, button('Confirmar respuesta', () => transition('confirmAnswer'), 'primary',
        { disabled: game.selection.length !== q.answerColors.length })));
  } else if (result) {
    const round = game.results.at(-1);
    panel.append(text('p', 'LA SOLUCIÓN', 'eyebrow'), colorTags(q.answerColors), text('p', q.explanation, 'explanation'));
    if (round.void) panel.append(text('p', 'Pregunta anulada. No cuenta para el marcador ni para las rondas. Se buscará otra pregunta al continuar.', 'void-note'));
    if (game.mode === 'physical' && !round.scored) {
      panel.append(text('h2', '¿Qué equipos han acertado?', 'result-heading'),
        text('p', 'Marca todos los aciertos. Si nadie ha acertado, confirma sin marcar equipos.', 'field-note'),
        el('div', { class: 'score-list' }, game.teams.map(team => button(`${game.physicalChoices.includes(team.id) ? '✓ ' : ''}${team.name}`, () => transition('togglePhysicalTeam', team.id), 'chip',
          { id: `physical-${team.id}`, 'aria-pressed': String(game.physicalChoices.includes(team.id)) }))),
        el('div', { class: 'game-actions' }, button('Anular pregunta', () => transition('askVoid'), 'text-button'),
          button('Confirmar ronda', () => transition('scorePhysical'), 'primary')));
    } else {
      if (game.teams.length) panel.append(text('h2', 'Marcador', 'result-heading'), scoreList(game, round));
      panel.append(el('div', { class: 'game-actions' }, !round.void ? button('Anular pregunta', () => transition('askVoid'), 'text-button') : null,
        button(!round.void && validRounds(game).length >= game.target ? 'Ver resultado final' : 'Siguiente pregunta →', () => transition('nextQuestion'), 'primary')));
    }
    panel.append(el('details', { class: 'sources' }, text('summary', 'Consultar las fuentes de esta pregunta'),
      q.sources.map(s => el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.title })),
      text('p', `Revisada el ${q.reviewedAt.split('-').reverse().join('/')}.`)));
  } else {
    panel.append(text('p', game.mode === 'physical' ? 'Elegid vuestras cartas antes de descubrir la solución.'
      : game.mode === 'pass' ? 'Leed la pregunta juntos. Después, cada equipo responderá en privado.' : 'Piensa en la respuesta y elige tus colores.', 'hint'),
      el('div', { class: 'game-actions' }, button(game.mode === 'physical' ? 'Ver respuesta' : game.mode === 'pass' ? 'Empezar los turnos' : 'Elegir colores',
        () => transition(game.mode === 'physical' ? 'reveal' : 'showTurns'), 'primary')));
  }
  root.append(panel);
  return root;
}
function renderFinal({ game, home, again }) {
  const count = validRounds(game).length, teamScores = scores(game);
  const top = Math.max(0, ...teamScores.map(t => t.score));
  const winners = teamScores.filter(t => t.score === top).map(t => t.name);
  const title = !count ? 'Sin rondas puntuables' : game.mode === 'solo' ? '¡Reto completado!'
    : !game.teams.length ? '¡Mazo completado!' : winners.length > 1 ? '¡Victoria compartida!' : `¡Gana ${winners[0]}!`;
  const root = el('section', { class: 'panel final-panel' },
    el('div', { class: 'neutral-symbol', text: '✦', 'aria-hidden': 'true' }),
    text('p', 'FIN DE LA PARTIDA', 'eyebrow'), heading(title),
    text('p', `${count} ${count === 1 ? 'ronda válida jugada' : 'rondas válidas jugadas'}.`, 'explanation'));
  if (count < game.target) root.append(text('p', 'Se han agotado las preguntas disponibles para sustituir las anuladas.', 'explanation'));
  if (game.mode === 'solo' && count) root.append(text('div', `${top} / ${count}`, 'big-score'), text('p', `${Math.round(top / count * 100)} % de aciertos`, 'explanation'));
  else if (game.teams.length) {
    if (count && winners.length > 1) root.append(text('p', winners.join(' · '), 'explanation'));
    root.append(scoreList(game));
  }
  root.append(el('div', { class: 'final-buttons' }, button('Volver a jugar', again, 'primary'), button('Inicio', home)));
  return root;
}
