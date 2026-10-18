// GitHub project sites cannot return custom 301s. Canonical + instant HTML
// redirects preserve old links and filters while Cloudflare hosts the application.
import {readdir,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {site} from './config.mjs';
import {escapeHtml} from './lib.mjs';
const input=path.resolve('dist'),output=path.resolve('legacy-dist');
await rm(output,{recursive:true,force:true});
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){await walk(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  const relative=path.relative(input,file);
  const html=await readFile(file,'utf8');
  const target=html.match(/rel="canonical" href="([^"]+)"/)[1];
  const script=`const root='/firstpatch';const p=location.pathname;const destination=${JSON.stringify(site)}+(p===root?'/':p.startsWith(root+'/')?p.slice(root.length):'/');location.replace(destination+location.search+location.hash);`;
  const destination=path.join(output,relative);await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FirstPatch has moved</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escapeHtml(target)}"><script>${script}</script><noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"></noscript></head><body><h1>FirstPatch has moved</h1><p><a href="${escapeHtml(target)}">Continue to FirstPatch on Cloudflare</a></p></body></html>`);
}}
await walk(input);await writeFile(path.join(output,'.nojekyll'),'');
console.log('Built legacy GitHub Pages redirects to '+site);
