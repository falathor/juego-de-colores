import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const version = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json())[0];
const data = (await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)).json()).data;
const inventory = await fs.readFile(new URL('./videojuegos.txt',import.meta.url),'utf8');
const slugs = [...inventory.matchAll(/champions\/([^/]+)\//g)].map(m=>m[1]);
const champions = slugs.map(slug=>Object.values(data).find(c=>c.id.toLowerCase()===slug)).filter(Boolean);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1250}});
  for(let i=0;i<champions.length;i+=8){
    const batch=champions.slice(i,i+8);
    await page.setContent(`<style>body{margin:0;background:white;font:20px system-ui}.grid{display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:4px;text-align:center}img{height:560px;max-width:100%;object-fit:contain}</style><div class="grid">${batch.map(c=>`<figure><figcaption>${c.name}</figcaption><img src="https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${c.id}_0.jpg"></figure>`).join('')}</div>`);
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
    await page.screenshot({path:`artifacts/lol-review-${i/8+1}.png`,fullPage:true});
  }
  console.log(`Ilustraciones base oficiales consultadas: ${champions.length}; Data Dragon ${version}.`);
} finally {await browser.close();}
