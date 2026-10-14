import test from 'node:test';
import assert from 'node:assert/strict';
import { idAllocator, questionKey } from '../tools/content/ids.mjs';
test('Los IDs editoriales son estables aunque cambie el orden y nunca reciclan retirados', () => {
  const a={category:'mitos',prompt:'Pregunta A'}, b={category:'mitos',prompt:'Pregunta B'}, retired={category:'mitos',prompt:'Retirada'};
  const registry={[questionKey(retired)]:'mitos-201'};
  const allocate=idAllocator(registry,[]);
  assert.equal(allocate(a),'mitos-202'); assert.equal(allocate(b),'mitos-203');
  const rerun=idAllocator(registry,[]);
  assert.equal(rerun(b),'mitos-203'); assert.equal(rerun(a),'mitos-202');
  assert.equal(rerun({category:'mitos',prompt:'Nueva'}),'mitos-204');
});
test('Un cambio de referencia conserva el ID y los IDs heredados quedan reservados', () => {
  const registry={}, allocate=idAllocator(registry,[{id:'cine-024'}]);
  const q={category:'cine',prompt:'Pregunta sobre un objeto',sources:[]};
  assert.equal(allocate(q),'cine-025');
  assert.equal(allocate({...q,prompt:'PREGUNTA  sobre un objeto',sources:[{url:'https://example.org'}]}),'cine-025');
});
