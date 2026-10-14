// Read-only source collection; cached extracts stay in ignored artifacts.
import fs from 'node:fs/promises';
const dir = new URL('./', import.meta.url), cache = new URL('../../artifacts/editorial-sources.json', import.meta.url);
const titles = new Set();
for (const file of await fs.readdir(dir)) if (file.endsWith('.txt')) {
  for (const line of (await fs.readFile(new URL(file,dir),'utf8')).split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const title = line.split('|')[0]; if (!title.startsWith('https://')) titles.add(title);
  }
}
let sources = {};
try { sources = JSON.parse(await fs.readFile(cache,'utf8')); } catch {}
const pending = [...titles].filter(title => !sources[title] || (!sources[title].missing && !sources[title].extract));
for (let offset = 0; offset < pending.length; offset += 20) {
  const batch = pending.slice(offset,offset+20);
  const url = new URL('https://en.wikipedia.org/w/api.php');
  for (const [key,value] of Object.entries({ action:'query', format:'json', redirects:'1', prop:'extracts|pageimages', exintro:'1', exlimit:'20', explaintext:'1', piprop:'thumbnail', pithumbsize:'500', titles:batch.join('|') })) url.searchParams.set(key,value);
  let response;
  for (let attempt=0; attempt<4; attempt++) {
    response = await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'DeQueColorEditorial/2.0 (quiz source review)'}});
    if (response.status!==429) break;
    console.log('Pausa de 30 segundos para respetar el límite de la fuente.');
    await new Promise(resolve=>setTimeout(resolve,30000));
  }
  if (!response.ok) throw Error(`Wikipedia: ${response.status}`);
  const data = await response.json(); if (data.error) throw Error(data.error.info);
  const normalize = Object.fromEntries((data.query.normalized || []).map(x=>[x.from,x.to]));
  const redirects = Object.fromEntries((data.query.redirects || []).map(x=>[x.from,x.to]));
  const pages = Object.values(data.query.pages);
  for (const title of batch) {
    let resolved = normalize[title] || title; const visited = new Set();
    while (redirects[resolved] && !visited.has(resolved)) { visited.add(resolved); resolved=redirects[resolved]; }
    const page = pages.find(p=>p.title===resolved);
    sources[title] = page?.pageid ? { title:page.title, pageid:page.pageid, extract:page.extract || '', image:page.thumbnail?.source || null } : { missing:true };
  }
  await fs.mkdir(new URL('../../artifacts/',import.meta.url),{recursive:true});
  await fs.writeFile(cache,JSON.stringify(sources));
  console.log(`Fuentes consultadas ${Math.min(offset+20,pending.length)}/${pending.length}`);
  await new Promise(resolve=>setTimeout(resolve,6000));
}
const overrides = JSON.parse(await fs.readFile(new URL('./source-overrides.json',import.meta.url),'utf8'));
const missing = [...titles].filter(title=>sources[title]?.missing && !overrides[title]);
console.log(JSON.stringify({references:titles.size,missing,explicitReferences:Object.keys(overrides).length},null,2));
