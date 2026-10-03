import { COLORS, CATEGORIES, DIFFICULTIES, validColors, validateCatalog, filteredQuestions } from './catalog.js';

const copy = value => JSON.parse(JSON.stringify(value));
export const currentQuestion = game => game.order[game.cursor];
export const validRounds = game => game.results.filter(r => r.scored && !r.void);
export function scores(game) {
  return game.teams.map(team => ({ ...team,
    score: validRounds(game).filter(round => round.correctTeamIds.includes(team.id)).length,
  }));
}
export function sameColors(left, right) {
  return validColors(left) && validColors(right) && left.length === right.length
    && left.every(color => right.includes(color));
}
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createGame(catalog, config, seen = [], random = Math.random) {
  if (!['physical', 'pass', 'solo'].includes(config.mode)
      || ![10, 20, 30].includes(config.duration)
      || !Array.isArray(config.categories) || !config.categories.length
      || !config.categories.every(id => CATEGORIES.some(c => c.id === id))
      || !(config.difficulty === 'todas' || Object.hasOwn(DIFFICULTIES, config.difficulty))) {
    throw new Error('La configuración no es válida.');
  }
  const names = config.mode === 'solo' ? ['Tú'] : (config.mode === 'physical' && !config.scoreboard ? [] : config.names);
  if (!Array.isArray(names) || (config.mode !== 'solo' && names.length !== 0 && (names.length < 2 || names.length > 4))
      || (config.mode === 'pass' && names.length < 2)
      || (config.mode === 'physical' && config.scoreboard && names.length < 2)
      || names.some(n => typeof n !== 'string' || !n.trim() || n.trim().length > 24)) {
    throw new Error('Escribe nombres de 1 a 24 caracteres para 2–4 equipos.');
  }
  const questions = filteredQuestions(catalog, config);
  if (!questions.length) throw new Error('No hay preguntas con estos filtros.');
  const used = new Set(seen);
  const order = [...shuffle(questions.filter(q => !used.has(q.id)), random),
    ...shuffle(questions.filter(q => used.has(q.id)), random)];
  return {
    schemaVersion: 1, contentVersion: catalog.contentVersion,
    id: globalThis.crypto?.randomUUID?.() || `partida-${Date.now()}-${Math.random()}`,
    mode: config.mode, filters: { categories: [...config.categories], difficulty: config.difficulty },
    requestedDuration: config.duration, target: Math.min(config.duration, order.length),
    teams: names.map((name, index) => ({ id: `team-${index}`, name: name.trim() })),
    order: copy(order), cursor: 0, phase: 'question', active: 0,
    selection: [], answers: {}, physicalChoices: [], results: [],
  };
}
// Every mutation is a phase-checked transition returning a new snapshot.
export function startAnswer(game) {
  if (game.mode === 'physical' || !['question', 'neutral'].includes(game.phase)) return game;
  return { ...game, phase: 'answering' };
}
export function showTurns(game) {
  if (game.mode === 'physical' || game.phase !== 'question') return game;
  return { ...game, phase: game.mode === 'solo' ? 'answering' : 'neutral' };
}
export function toggleColor(game, color) {
  if (game.phase !== 'answering' || !COLORS.some(c => c.id === color)) return game;
  const selected = game.selection.includes(color);
  if (!selected && game.selection.length >= currentQuestion(game).answerColors.length) return game;
  return { ...game, selection: selected ? game.selection.filter(c => c !== color) : [...game.selection, color] };
}
export function confirmAnswer(game) {
  if (game.phase !== 'answering' || game.selection.length !== currentQuestion(game).answerColors.length) return game;
  const answers = { ...game.answers, [game.teams[game.active].id]: [...game.selection] };
  const next = { ...game, answers, selection: [] };
  if (game.active + 1 < game.teams.length) return { ...next, active: game.active + 1, phase: 'neutral' };
  next.phase = 'ready';
  return game.mode === 'solo' ? reveal(next) : next;
}
export function reveal(game) {
  if (!((game.mode === 'physical' && game.phase === 'question') || game.phase === 'ready')) return game;
  const q = currentQuestion(game);
  const correctTeamIds = game.mode === 'physical' ? []
    : game.teams.filter(t => sameColors(game.answers[t.id], q.answerColors)).map(t => t.id);
  const result = { questionId: q.id, answers: copy(game.answers), correctTeamIds,
    scored: game.mode !== 'physical' || game.teams.length === 0, void: false };
  return { ...game, phase: 'result', results: [...game.results, result] };
}
export function togglePhysicalTeam(game, teamId) {
  const result = game.results.at(-1);
  if (game.mode !== 'physical' || game.phase !== 'result' || result?.scored
      || !game.teams.some(t => t.id === teamId)) return game;
  return { ...game, physicalChoices: game.physicalChoices.includes(teamId)
    ? game.physicalChoices.filter(id => id !== teamId) : [...game.physicalChoices, teamId] };
}
export function scorePhysical(game) {
  if (game.mode !== 'physical' || game.phase !== 'result' || game.results.at(-1)?.scored) return game;
  return { ...game, results: game.results.map((r, i) => i === game.results.length - 1
    ? { ...r, scored: true, correctTeamIds: [...game.physicalChoices] } : r) };
}
export function voidQuestion(game) {
  if (game.phase !== 'result' || game.results.at(-1)?.void) return game;
  return { ...game, results: game.results.map((r, i) => i === game.results.length - 1
    ? { ...r, void: true, scored: true, correctTeamIds: [] } : r) };
}
export function nextQuestion(game) {
  if (game.phase !== 'result' || !game.results.at(-1)?.scored) return game;
  if (validRounds(game).length >= game.target || game.cursor + 1 >= game.order.length) {
    return { ...game, phase: 'finished', selection: [] };
  }
  return { ...game, cursor: game.cursor + 1, phase: 'question', active: 0,
    selection: [], answers: {}, physicalChoices: [] };
}

export function restoreGame(value) {
  const fail = () => { throw new Error('La partida guardada no es válida.'); };
  if (!value || value.schemaVersion !== 1 || typeof value.id !== 'string'
      || !['physical', 'pass', 'solo'].includes(value.mode)
      || !['question', 'neutral', 'answering', 'ready', 'result', 'finished'].includes(value.phase)
      || !Array.isArray(value.order) || !value.order.length || value.order.length > 5000
      || ![10, 20, 30].includes(value.requestedDuration)
      || value.target !== Math.min(value.requestedDuration, value.order.length)
      || !Number.isInteger(value.cursor) || value.cursor < 0 || value.cursor >= value.order.length
      || !Array.isArray(value.teams) || !Array.isArray(value.results)
      || !value.filters || !Array.isArray(value.filters.categories) || !value.filters.categories.length
      || !value.filters.categories.every(id => CATEGORIES.some(c => c.id === id))
      || !(value.filters.difficulty === 'todas' || Object.hasOwn(DIFFICULTIES, value.filters.difficulty))) fail();
  if (validateCatalog({ schemaVersion: 1, contentVersion: value.contentVersion,
    locale: 'es-ES', questions: value.order }).length || value.order.some(q => q.status !== 'approved')) fail();
  if ((value.mode === 'solo' && value.teams.length !== 1)
      || (value.mode === 'pass' && (value.teams.length < 2 || value.teams.length > 4))
      || (value.mode === 'physical' && ![0, 2, 3, 4].includes(value.teams.length))
      || value.teams.some((t, i) => t.id !== `team-${i}` || typeof t.name !== 'string'
        || !t.name.trim() || t.name.length > 24)) fail();
  const ids = value.teams.map(t => t.id);
  const subset = list => Array.isArray(list) && new Set(list).size === list.length && list.every(id => ids.includes(id));
  const validAnswers = (answers, question) => answers && typeof answers === 'object' && !Array.isArray(answers)
    && Object.entries(answers).every(([id, colors]) => ids.includes(id) && validColors(colors)
      && colors.length === question.answerColors.length);
  if (!Number.isInteger(value.active) || value.active < 0 || value.active >= Math.max(1, ids.length)
      || !Array.isArray(value.selection) || new Set(value.selection).size !== value.selection.length
      || !value.selection.every(id => COLORS.some(c => c.id === id))
      || value.selection.length > currentQuestion(value).answerColors.length
      || !subset(value.physicalChoices) || !validAnswers(value.answers, currentQuestion(value))) fail();
  const resultPhase = ['result', 'finished'].includes(value.phase);
  if (value.results.length !== value.cursor + (resultPhase ? 1 : 0)) fail();
  for (const [index, round] of value.results.entries()) {
    if (round.questionId !== value.order[index].id || typeof round.void !== 'boolean'
        || typeof round.scored !== 'boolean' || !subset(round.correctTeamIds)
        || !validAnswers(round.answers, value.order[index])
        || (index < value.results.length - 1 && !round.scored)
        || (round.void && (!round.scored || round.correctTeamIds.length))) fail();
    if (value.mode !== 'physical') {
      const expected = ids.filter(id => sameColors(round.answers[id], value.order[index].answerColors));
      if (!round.scored || Object.keys(round.answers).length !== ids.length
          || (!round.void && (expected.length !== round.correctTeamIds.length
            || !expected.every(id => round.correctTeamIds.includes(id))))) fail();
    } else if (Object.keys(round.answers).length || (!round.scored && round.correctTeamIds.length)) fail();
  }
  if (value.mode === 'physical') {
    if (!['question', 'result', 'finished'].includes(value.phase) || value.selection.length
        || Object.keys(value.answers).length || value.active !== 0) fail();
  } else {
    const answered = Object.keys(value.answers);
    if (['question', 'neutral', 'answering'].includes(value.phase)) {
      if (answered.length !== value.active || !ids.slice(0, value.active).every(id => answered.includes(id))) fail();
      if (value.phase === 'question' && (value.active !== 0 || value.selection.length)) fail();
    } else if (answered.length !== ids.length || value.selection.length) fail();
    if (value.physicalChoices.length) fail();
  }
  if (resultPhase && (JSON.stringify(value.results.at(-1).answers) !== JSON.stringify(value.answers))) fail();
  if (value.phase === 'finished' && (!value.results.at(-1).scored
      || (validRounds(value).length < value.target && value.cursor + 1 < value.order.length))) fail();
  if (value.phase !== 'finished' && validRounds(value).length > value.target) fail();
  const game = copy(value);
  // Reloading never exposes a digital team's in-progress choices directly.
  if (game.phase === 'answering') game.phase = 'neutral';
  return game;
}
