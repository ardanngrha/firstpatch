import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {site,base} from './config.mjs';
const root=path.resolve('dist');const htmlFiles=[];async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())await walk(p);else if(f.name.endsWith('.html')){if(dir===root&&/^google[a-f0-9]+\.html$/.test(f.name)){if((await readFile(p,'utf8')).trim()!==`google-site-verification: ${f.name}`)throw new Error('Invalid Google ownership verification file');}else htmlFiles.push(p);}}}await walk(root);
const errors=[];const canonicalSet=new Set();let links=0;
for(const file of htmlFiles){const html=await readFile(file,'utf8');const relative=path.relative(root,file);const fail=m=>errors.push(`${relative}: ${m}`);
  if((html.match(/<h1[ >]/g)||[]).length!==1)fail('Expected exactly one H1');
  if(!/<html lang="en">/.test(html))fail('Missing document language');
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];if(!title||title.length>90)fail('Missing or excessively long title');
  if(!/<meta name="description" content="[^"]{30,}"/.test(html))fail('Missing description');
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];const expected=site+'/'+(relative==='index.html'?'':relative.replace(/index\.html$/,'').split(path.sep).join('/'));if(canonical!==expected)fail('Incorrect canonical');if(canonicalSet.has(canonical))fail('Duplicate canonical');canonicalSet.add(canonical);
  if(!html.includes('application/ld+json'))fail('Missing structured data');
  for(const block of html.matchAll(/<script type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/g))try{JSON.parse(block[1]);}catch{fail('Invalid JSON script');}
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^" ]*"/g)){if(!match[1].startsWith(base+'/')||match[1].startsWith('//'))continue;links++;const local=path.resolve(root,match[1].slice((base+'/').length));if(local!==root&&!local.startsWith(root+path.sep))fail('Path escaped site root');let check=local;if(match[1].endsWith('/'))check=path.join(local,'index.html');try{await stat(check);}catch{fail(`Broken internal link ${match[1]}`);}}
  for(const property of ['og:url','og:image']){const value=html.match(new RegExp(`<meta property="${property}" content="([^"]+)"`))?.[1];if(value!==(property==='og:url'?canonical:site+'/assets/firstpatch-mark.png'))fail(`Incorrect ${property}`);}
  if(/href="#"/.test(html))fail('Dead anchor');if(html.includes('Sample data'))fail('Sample data leaked into production');
}
const siteMap=await readFile(path.join(root,'sitemap.xml'),'utf8');if((siteMap.match(/<loc>/g)||[]).length!==htmlFiles.length-1)errors.push('Sitemap does not match indexable pages');
for(const m of siteMap.matchAll(/<loc>([^<]+)<\/loc>/g))if(!canonicalSet.has(m[1])||m[1].endsWith('/404.html'))errors.push('Invalid sitemap URL '+m[1]);
const robots=await readFile(path.join(root,'robots.txt'),'utf8');if(!robots.includes(`Sitemap: ${site}/sitemap.xml`)||!robots.includes('Allow: /'))errors.push('Incorrect root robots.txt');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Checked ${htmlFiles.length} HTML pages, ${links} local links/assets, JSON-LD, canonicals, metadata and sitemap. All passed.`);
const css=await readFile(path.join(root,'assets/style.css'),'utf8');
function luminance(hex){if(hex.length===3)hex=[...hex].map(v=>v+v).join('');const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const [mode,block] of [['light',css.match(/:root\{([^}]+)\}/)[1]],['dark',css.match(/:root\[data-theme=dark\]\{([^}]+)\}/)[1]]]){const tokens=Object.fromEntries([...block.matchAll(/--([\w-]+):#([a-f\d]{3,6})/g)].map(m=>[m[1],m[2]]));let minimum=100;for(const [foreground,background] of [['ink','canvas'],['ink','field'],['muted','canvas'],['muted','tag'],['muted','detail'],['action','canvas'],['action','detail'],['canvas','action']]){const ratio=contrast(tokens[foreground],tokens[background]);minimum=Math.min(minimum,ratio);if(ratio<4.5){console.error(`${mode}: ${foreground}/${background} contrast ${ratio} below 4.5:1`);process.exitCode=1;}}console.log(`${mode} theme text contrast: minimum ${minimum.toFixed(2)}:1 across semantic text pairs (threshold checked unrounded).`);}
