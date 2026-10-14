import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, validateCatalog } from '../../js/catalog.js';
import { idAllocator, questionKey } from './ids.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => fs.readFileSync(root + path, 'utf8');
const original = JSON.parse(read('tools/content/catalog-1.2.0.json'));
const overrides = JSON.parse(read('tools/content/source-overrides.json'));
const colors = { r: 'rojo', o: 'naranja', y: 'amarillo', v: 'verde', a: 'azul', p: 'morado', s: 'rosa', b: 'marron', n: 'negro', w: 'blanco', g: 'gris' };
const labels = { r: 'rojo', o: 'naranja', y: 'amarillo', v: 'verde', a: 'azul', p: 'morado', s: 'rosa', b: 'marrón', n: 'negro', w: 'blanco', g: 'gris' };
const levels = { f: 'facil', m: 'medio', d: 'dificil' };
const moved = new Set([2,3,6,7,8,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24].map(n => `animacion-${String(n).padStart(3,'0')}`));
const questions = original.questions.map(q => moved.has(q.id) ? { ...q, category: 'videojuegos' } : q);
const registryPath=root+'tools/content/question-ids.json';
const registry=fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath,'utf8')) : {};
if (!Object.keys(registry).length) {
  const current=JSON.parse(read('data/questions.es.json'));
  if(current.contentVersion==='2.0.0') for(const q of current.questions.slice(original.questions.length)) registry[questionKey(q)]=q.id;
}
const allocate=idAllocator(registry,questions);
const candidates = [];
for (const category of CATEGORIES) {
  const path = `tools/content/${category.id}.txt`;
  if (!fs.existsSync(root + path)) continue;
  for (const [lineIndex, line] of read(path).split(/\r?\n/).entries()) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [reference, context, facts] = line.split('|');
    if (!reference || !context || !facts) throw Error(`${path}:${lineIndex+1}: perfil incompleto`);
    const url = overrides[reference] || (reference.startsWith('https://') ? reference : `https://en.wikipedia.org/wiki/${encodeURIComponent(reference.replaceAll(' ', '_'))}`);
    for (const fact of facts.split(';')) {
      const match = /^(.+)=(\w+)\/([fmd])$/.exec(fact.trim());
      if (!match || [...match[2]].some(c => !colors[c])) throw Error(`${path}:${lineIndex+1}: hecho inválido ${fact}`);
      const [, part, codes, level] = match;
      const plural = /^(los|las) /.test(part);
      const verb = plural ? 'son' : 'es';
      candidates.push({ category: category.id, difficulty: levels[level],
        prompt: `En ${context}, ${part === 'el color principal' ? '¿qué color predomina?' : part === 'el color aludido por ese nombre' ? '¿a qué color alude ese nombre?' : part === 'los dos colores entre los que cambia su vestido' ? '¿entre qué dos colores cambia su vestido?' : `¿de qué ${codes.length > 1 ? 'colores' : 'color'} ${verb} ${part}?`}`,
        answerColors: [...codes].map(c => colors[c]),
        explanation: `${part[0].toUpperCase()+part.slice(1)} ${plural ? 'se representan' : 'se representa'} en ${[...codes].map(c => labels[c]).join(' y ')} en la versión o situación indicada.`,
        tags: [category.id], status: 'approved', sources: [{ title: reference.startsWith('https://') ? 'Referencia del diseño o descripción' : `Referencia: ${reference}`, url }], reviewedAt: '2026-10-15',
      });
    }
  }
}
if (fs.existsSync(root + 'tools/content/pokemon.json')) candidates.push(...JSON.parse(read('tools/content/pokemon.json')));
const seen = new Set(questions.map(q => q.prompt.toLocaleLowerCase('es')));
const report = [];
for (const category of CATEGORIES) {
  const current = questions.filter(q => q.category === category.id && q.status === 'approved');
  const pool = candidates.filter(q => q.category === category.id && !seen.has(q.prompt.toLocaleLowerCase('es')));
  const selected = [];
  for (const level of Object.values(levels)) {
    const existing = current.filter(q => q.difficulty === level).length;
    selected.push(...pool.filter(q => q.difficulty === level).slice(0, Math.max(0, 50 - existing)));
  }
  const chosen = new Set(selected);
  for (const q of pool) if (selected.length + current.length < 200 && !chosen.has(q)) { selected.push(q); chosen.add(q); }
  const counts = Object.fromEntries(Object.values(levels).map(d => [d, current.filter(q => q.difficulty === d).length + selected.filter(q => q.difficulty === d).length]));
  report.push({ category: category.id, total: current.length + selected.length, available: pool.length, ...counts });
  for (const q of selected) { q.id=allocate(q); seen.add(q.prompt.toLocaleLowerCase('es')); questions.push(q); }
}
console.table(report);
const result = { schemaVersion: 1, contentVersion: '2.0.0', locale: 'es-ES', questions };
const errors = validateCatalog(result);
if (errors.length) throw Error(errors.join('\n'));
const incomplete = report.some(r => r.total !== 200 || ['facil','medio','dificil'].some(d => r[d] < 50));
if (incomplete) { console.log('Inventario incompleto: no se modifica el catálogo publicado.'); process.exitCode = 2; }
else {
  fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
  fs.writeFileSync(root+'data/questions.es.json', JSON.stringify(result, null, 2)+'\n');
  console.log('Catálogo 2.0.0: 2.000 aprobadas, un borrador.');
}
