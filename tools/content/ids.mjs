import { createHash } from 'node:crypto';
export const questionKey = question => createHash('sha256').update(`${question.category}|${question.prompt.trim().replace(/\s+/g,' ').toLocaleLowerCase('es')}`).digest('hex');
export function idAllocator(registry, existing) {
  const reserved = new Set([...Object.values(registry), ...existing.map(q=>q.id)]);
  return question => {
    const key = questionKey(question);
    if (registry[key]) return registry[key];
    let number=0, id;
    for (const value of reserved) if(value.startsWith(question.category+'-')) number=Math.max(number,Number(value.split('-').at(-1)));
    do { id=`${question.category}-${String(++number).padStart(3,'0')}`; } while(reserved.has(id));
    reserved.add(id); registry[key]=id; return id;
  };
}
