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
  // Fingerprint of all 49 original entries, including the excluded draft.
  let previousFingerprint = 2166136261;
  for (const char of JSON.stringify(catalog.questions.slice(0, 49))) {
    previousFingerprint = Math.imul(previousFingerprint ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return [
    { name: 'Catálogo real: 98 aprobadas, un borrador y cobertura de ocho categorías',
      ok: !errors.length && approved.length === 98 && catalog.questions.length === 99
        && CATEGORIES.every(c => approved.filter(q => q.category === c.id).length >= 12), error: errors.join('; ') },
    { name: 'Ampliación: cincuenta nuevas revisadas, 49 previas intactas y versión 1.1.0',
      ok: catalog.contentVersion === '1.1.0' && addedIds.length === 50
        && previousFingerprint === 3897497037
        && addedIds.every(id => approved.some(q => q.id === id && q.sources.length && q.reviewedAt === '2026-10-03')) },
    { name: 'Soluciones: contraste de texto de al menos 4,5:1 en los once colores',
      ok: COLORS.every(c => contrastRatio(c.hex, solutionTextColor(c.hex)) >= 4.5) },
  ];
}
