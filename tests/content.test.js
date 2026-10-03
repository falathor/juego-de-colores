import { COLORS, CATEGORIES, validateCatalog } from '../js/catalog.js';
import { solutionTextColor } from '../js/ui.js';

export function contrastRatio(left, right) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255)
      .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return channels.reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  };
  const a = luminance(left), b = luminance(right);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

export function runContentTests(catalog) {
  const approved = catalog.questions.filter(q => q.status === 'approved');
  const ranges = [['espana',7,13], ['series',7,13], ['cine',7,12], ['animacion',7,12],
    ['deportes',7,12], ['naturaleza',7,12], ['comida',8,13], ['cotidiano',7,12]];
  const addedIds = ranges.flatMap(([category, start, end]) => Array.from({ length: end - start + 1 },
    (_, i) => `${category}-${String(start + i).padStart(3, '0')}`));
  const errors = validateCatalog(catalog);
  // Preserve both previous releases, including the excluded draft.
  const fingerprint = questions => {
    let value = 2166136261;
    for (const char of JSON.stringify(questions)) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
    return value;
  };
  const newRanges = [['espana',14,25], ['series',14,25], ['cine',13,24], ['animacion',13,24],
    ['deportes',13,25], ['naturaleza',13,25], ['comida',14,26], ['cotidiano',13,25]];
  const newIds = newRanges.flatMap(([category, start, end]) => Array.from({ length: end - start + 1 },
    (_, i) => `${category}-${String(start + i).padStart(3, '0')}`));
  return [
    { name: 'Catálogo real: 198 aprobadas, un borrador y cobertura de ocho categorías',
      ok: !errors.length && approved.length === 198 && catalog.questions.length === 199
        && CATEGORIES.every(c => approved.filter(q => q.category === c.id).length >= 24), error: errors.join('; ') },
    { name: 'Ampliación anterior: cincuenta revisadas y 49 entradas originales intactas',
      ok: addedIds.length === 50 && fingerprint(catalog.questions.slice(0, 49)) === 3897497037
        && addedIds.every(id => approved.some(q => q.id === id && q.sources.length && q.reviewedAt === '2026-10-03')) },
    { name: 'Ampliación actual: cien nuevas revisadas, 99 previas intactas y versión 1.2.0',
      ok: catalog.contentVersion === '1.2.0' && newIds.length === 100
        && fingerprint(catalog.questions.slice(0, 99)) === 2707174224
        && newIds.every(id => approved.some(q => q.id === id && q.sources.length && q.reviewedAt === '2026-10-03')) },
    { name: 'Soluciones: contraste de texto de al menos 4,5:1 en los once colores',
      ok: COLORS.every(c => contrastRatio(c.hex, solutionTextColor(c.hex)) >= 4.5) },
  ];
}
