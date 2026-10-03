export const COLORS = Object.freeze([
  ['rojo', 'Rojo', '#D62828'], ['naranja', 'Naranja', '#F28C28'],
  ['amarillo', 'Amarillo', '#F2D13D'], ['verde', 'Verde', '#27804B'],
  ['azul', 'Azul', '#2563EB'], ['morado', 'Morado', '#7C3AED'],
  ['rosa', 'Rosa', '#EC7DA7'], ['marron', 'Marrón', '#855536'],
  ['negro', 'Negro', '#202124'], ['blanco', 'Blanco', '#FFFFFF'],
  ['gris', 'Gris', '#8A8F98'],
].map(([id, label, hex]) => Object.freeze({ id, label, hex })));

export const CATEGORIES = Object.freeze([
  ['espana', 'España y tradiciones', '◎'], ['series', 'Series conocidas', '▣'],
  ['cine', 'Cine', '▷'], ['animacion', 'Animación y videojuegos', '✦'],
  ['deportes', 'Deportes', '⚑'], ['naturaleza', 'Naturaleza', '❋'],
  ['comida', 'Comida y bebida', '◒'], ['cotidiano', 'Cultura general y vida cotidiana', '⌂'],
].map(([id, label, icon]) => Object.freeze({ id, label, icon })));
export const DIFFICULTIES = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
export function validColors(value) {
  return Array.isArray(value) && value.length >= 1 && value.length <= 4
    && new Set(value).size === value.length
    && value.every(id => COLORS.some(color => color.id === id));
}
export function validateCatalog(data) {
  const errors = [];
  if (!data || data.schemaVersion !== 1 || data.locale !== 'es-ES'
      || !nonempty(data.contentVersion) || !Array.isArray(data.questions)) {
    return ['Formato del catálogo incompatible.'];
  }
  const ids = new Set(), prompts = new Set();
  for (const [index, q] of data.questions.entries()) {
    const label = q?.id || `Pregunta ${index + 1}`;
    if (!q || !nonempty(q.id) || ids.has(q.id)) errors.push(`${label}: ID ausente o duplicado.`);
    ids.add(q?.id);
    if (!CATEGORIES.some(c => c.id === q?.category)) errors.push(`${label}: categoría inválida.`);
    if (!Object.hasOwn(DIFFICULTIES, q?.difficulty)) errors.push(`${label}: dificultad inválida.`);
    if (!nonempty(q?.prompt) || !nonempty(q?.explanation)) errors.push(`${label}: texto vacío.`);
    const normalized = typeof q?.prompt === 'string' ? q.prompt.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES') : '';
    if (prompts.has(normalized)) errors.push(`${label}: enunciado duplicado.`);
    prompts.add(normalized);
    if (!validColors(q?.answerColors)) errors.push(`${label}: colores inválidos.`);
    if (!['draft', 'approved'].includes(q?.status)) errors.push(`${label}: estado inválido.`);
    if (!Array.isArray(q?.tags) || !q.tags.every(nonempty)) errors.push(`${label}: etiquetas inválidas.`);
    if (!Array.isArray(q?.sources) || !q.sources.every(s => nonempty(s?.title)
        && typeof s?.url === 'string' && /^https?:\/\/[^\s]+$/.test(s.url))) {
      errors.push(`${label}: fuentes inválidas.`);
    }
    if (q?.status === 'approved' && (!q.sources?.length || typeof q.reviewedAt !== 'string'
        || !/^\d{4}-\d{2}-\d{2}$/.test(q.reviewedAt)
        || !Number.isFinite(Date.parse(q.reviewedAt))
        || new Date(q.reviewedAt).toISOString().slice(0, 10) !== q.reviewedAt)) {
      errors.push(`${label}: falta revisión documentada.`);
    }
  }
  return errors;
}
export function filteredQuestions(catalog, filters) {
  return catalog.questions.filter(q => q.status === 'approved'
    && filters.categories.includes(q.category)
    && (filters.difficulty === 'todas' || q.difficulty === filters.difficulty));
}
export async function loadCatalog() {
  const response = await fetch(new URL('../data/questions.es.json', import.meta.url));
  if (!response.ok) throw new Error('No se ha podido cargar el catálogo.');
  const data = await response.json();
  const errors = validateCatalog(data);
  if (errors.length) throw new Error('El catálogo contiene preguntas inválidas.');
  return data;
}
