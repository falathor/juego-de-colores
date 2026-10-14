import fs from 'node:fs/promises';
const names = ['charmander','squirtle','pikachu','jigglypuff','clefairy','psyduck','meowth','machop','geodude','poliwag','oddish','diglett','magnemite','drowzee','voltorb','cubone','koffing','tangela','horsea','staryu','magikarp','lapras','ditto','eevee','porygon','snorlax','dratini','mew','chikorita','cyndaquil','totodile','sentret','hoothoot','mareep','marill','wooper','girafarig','dunsparce','snubbull','slugma','swinub','remoraid','houndour','phanpy','smeargle','miltank','raikou','suicune','celebi','mudkip'];
const translations = { black: 'negro', blue: 'azul', brown: 'marron', gray: 'gris', green: 'verde', pink: 'rosa', purple: 'morado', red: 'rojo', white: 'blanco', yellow: 'amarillo' };
const questions = [];
for (let offset = 0; offset < names.length; offset += 5) {
  const batch = await Promise.all(names.slice(offset, offset+5).map(async name => {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${name}/`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`PokéAPI ${name}: ${response.status}`);
    const data = await response.json(), label = data.names.find(n => n.language.name === 'es')?.name || data.name;
    const color = translations[data.color.name]; if (!color) throw Error('Color desconocido');
    return { category: 'videojuegos', difficulty: offset < 15 ? 'facil' : offset < 35 ? 'medio' : 'dificil',
      prompt: `En la clasificación por colores de la Pokédex de los videojuegos, ¿qué color corresponde a ${label}, sin contar formas variocolor?`,
      answerColors: [color], explanation: `${label} figura en el grupo ${color === 'marron' ? 'marrón' : color} de la clasificación por color de especie. Esta pregunta trata esa clasificación, no todos los detalles de su cuerpo.`,
      tags: ['videojuegos','pokemon','pokedex'], status: 'approved', sources: [{ title: `PokéAPI · Especie ${label}, clasificación de color`, url }], reviewedAt: '2026-10-15' };
  })); questions.push(...batch);
}
await fs.writeFile(new URL('./pokemon.json', import.meta.url), JSON.stringify(questions, null, 2)+'\n');
console.log(`Revisadas ${questions.length} clasificaciones de especie a partir del campo color de su ficha.`);
