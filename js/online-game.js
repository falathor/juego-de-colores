import { CATEGORIES, DIFFICULTIES, validColors, filteredQuestions } from './catalog.js';
import { sameColors, shuffle } from './game.js';

export const ROOM_LIFETIME = 6 * 60 * 60 * 1000;
export const MAX_PLAYERS = 8;
export const validCode = code => typeof code === 'string' && /^\d{4}$/.test(code);
export function playerName(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 24 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error('Escribe un nombre de 1 a 24 caracteres.');
  }
  return value.trim();
}
export function validateOnlineConfig(config) {
  if (!config || ![10,20,30].includes(config.duration) || !Array.isArray(config.categories)
      || !config.categories.length || new Set(config.categories).size !== config.categories.length
      || !config.categories.every(id => CATEGORIES.some(c => c.id === id))
      || !(config.difficulty === 'todas' || Object.hasOwn(DIFFICULTIES, config.difficulty))) {
    throw new Error('La configuración de la partida no es válida.');
  }
}
export function createRoom(code, player, config, catalog, now = Date.now(), random = Math.random) {
  if (!validCode(code)) throw new Error('El código debe tener cuatro dígitos.');
  validateOnlineConfig(config);
  const order = shuffle(filteredQuestions(catalog, config), random);
  if (!order.length) throw new Error('No hay preguntas con estos filtros.');
  return { code, createdAt: now, expiresAt: now + ROOM_LIFETIME, revision: 0, phase: 'lobby',
    hostId: player.id, players: [{ ...player, name: playerName(player.name, 'Jugador 1') }],
    config: { duration: config.duration, categories: [...config.categories], difficulty: config.difficulty },
    target: Math.min(config.duration, order.length), order, round: 0, answers: {}, results: [] };
}
export function assertRoomOpen(room, now = Date.now()) {
  if (!room || room.expiresAt <= now) throw new Error('La sala no existe o ha caducado.');
  if (room.phase === 'closed') throw new Error('El anfitrión ha cerrado la sala.');
}
export function joinRoom(room, player, now = Date.now()) {
  assertRoomOpen(room, now);
  if (room.phase !== 'lobby') throw new Error('La partida ya ha empezado. Solo pueden volver quienes estaban dentro.');
  if (room.players.length >= MAX_PLAYERS) throw new Error('La sala está llena (máximo ocho jugadores).');
  let number = 1;
  while (room.players.some(p => p.name.toLocaleLowerCase('es') === `jugador ${number}`)) number++;
  const name = playerName(player.name, `Jugador ${number}`);
  if (room.players.some(p => p.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
    throw new Error('Ya hay alguien con ese nombre. Elige otro.');
  }
  return { ...room, revision: room.revision + 1, players: [...room.players, { ...player, name }] };
}
const rounds = room => room.results.filter(r => !r.void);
export function roomView(room, playerId, now = Date.now()) {
  assertRoomOpen(room, now);
  if (!room.players.some(p => p.id === playerId)) throw new Error('Esta sesión no pertenece a la sala.');
  const revealed = room.phase === 'result';
  const q = room.order[room.round];
  const last = room.results.at(-1);
  return { code: room.code, expiresAt: room.expiresAt, revision: room.revision, phase: room.phase,
    myId: playerId, hostId: room.hostId, config: room.config, target: room.target, round: room.round,
    completed: rounds(room).length, allAnswered: room.players.every(p => Object.hasOwn(room.answers, p.id)),
    players: room.players.map(p => ({ id: p.id, name: p.name,
      submitted: Object.hasOwn(room.answers, p.id),
      score: rounds(room).filter(r => r.correctIds.includes(p.id)).length })),
    ownAnswer: room.answers[playerId] || null,
    question: ['lobby','finished'].includes(room.phase) ? null : revealed ? {
      id: q.id, prompt: q.prompt, category: q.category, difficulty: q.difficulty,
      required: q.answerColors.length, answerColors: q.answerColors, explanation: q.explanation,
      sources: q.sources, reviewedAt: q.reviewedAt,
    } : { id: q.id, prompt: q.prompt, category: q.category, difficulty: q.difficulty, required: q.answerColors.length },
    result: revealed ? { void: last.void, answers: last.answers, correctIds: last.correctIds } : null,
  };
}
export function actOnRoom(room, playerId, command, now = Date.now()) {
  assertRoomOpen(room, now);
  if (!room.players.some(p => p.id === playerId)) throw new Error('Esta sesión no pertenece a la sala.');
  if (!command || typeof command.action !== 'string') throw new Error('La acción no es válida.');
  const host = room.hostId === playerId;
  const hostActions = ['start','reveal','next','void','close'];
  if (hostActions.includes(command.action) && !host) throw new Error('Solo el anfitrión puede hacer eso.');
  if (command.action === 'rename') {
    const name = playerName(command.name);
    if (!name) throw new Error('Escribe un nombre de 1 a 24 caracteres.');
    if (room.players.some(p => p.id !== playerId && p.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
      throw new Error('Ya hay alguien con ese nombre. Elige otro.');
    }
    if (room.players.find(p => p.id === playerId).name === name) return room;
    return { ...room, revision: room.revision + 1,
      players: room.players.map(p => p.id === playerId ? { ...p, name } : p) };
  }
  if (command.action === 'close') return { ...room, phase: 'closed', revision: room.revision + 1 };
  if (command.action === 'leave') {
    if (host) return { ...room, phase: 'closed', revision: room.revision + 1 };
    if (room.phase !== 'lobby') throw new Error('Puedes volver a esta partida con tu sesión guardada.');
    return { ...room, players: room.players.filter(p => p.id !== playerId), revision: room.revision + 1 };
  }
  if (command.action === 'start') {
    if (room.phase !== 'lobby') return room;
    if (room.players.length < 2) throw new Error('Esperad al menos a otro jugador para empezar.');
    return { ...room, phase: 'answering', revision: room.revision + 1 };
  }
  if (!Number.isInteger(command.round) || command.round !== room.round) return room;
  if (command.action === 'answer') {
    if (room.phase !== 'answering' || Object.hasOwn(room.answers, playerId)) return room;
    if (!validColors(command.colors) || command.colors.length !== room.order[room.round].answerColors.length) {
      throw new Error('Elige exactamente los colores que pide la pregunta.');
    }
    return { ...room, answers: { ...room.answers, [playerId]: [...command.colors] }, revision: room.revision + 1 };
  }
  if (command.action === 'reveal') {
    if (room.phase !== 'answering') return room;
    if (!room.players.every(p => Object.hasOwn(room.answers, p.id)) && command.force !== true) {
      throw new Error('Todavía faltan respuestas. Puedes confirmar cerrar la ronda.');
    }
    const result = { questionId: room.order[room.round].id, answers: structuredClone(room.answers), void: false,
      correctIds: room.players.filter(p => sameColors(room.answers[p.id], room.order[room.round].answerColors)).map(p => p.id) };
    return { ...room, phase: 'result', results: [...room.results, result], revision: room.revision + 1 };
  }
  if (command.action === 'void') {
    if (room.phase !== 'result' || room.results.at(-1).void) return room;
    return { ...room, results: room.results.map((r,i) => i === room.results.length - 1 ? { ...r, void: true, correctIds: [] } : r), revision: room.revision + 1 };
  }
  if (command.action === 'next') {
    if (room.phase !== 'result') return room;
    const finished = rounds(room).length >= room.target || room.round + 1 >= room.order.length;
    return { ...room, phase: finished ? 'finished' : 'answering', round: finished ? room.round : room.round + 1,
      answers: finished ? room.answers : {}, revision: room.revision + 1 };
  }
  throw new Error('La acción no está disponible.');
}
