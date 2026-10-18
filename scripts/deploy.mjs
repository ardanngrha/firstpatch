import {execFileSync} from 'node:child_process';
import {readFile,appendFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {site} from './config.mjs';

const root=new URL('../',import.meta.url);
const hook=process.env.CLOUDFLARE_DEPLOY_HOOK;
if(!hook)throw new Error('Missing CLOUDFLARE_DEPLOY_HOOK repository secret.');
let hookUrl;
try{hookUrl=new URL(hook);}catch{throw new Error('Invalid deploy hook URL.');}
if(hookUrl.origin!=='https://api.cloudflare.com'||!/^\/client\/v4\/pages\/webhooks\/deploy_hooks\/[a-zA-Z0-9-]+$/.test(hookUrl.pathname)||hookUrl.search||hookUrl.hash){
  throw new Error('Expected a Cloudflare Pages Deploy Hook URL.');
}
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const catalog=JSON.parse(await readFile(new URL('data/catalog.json',root),'utf8'));
// Never print the URL or raw errors/responses: the hook is a bearer secret.
let response;
try{response=await fetch(hookUrl,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000)});}
catch{throw new Error('Could not contact the deploy hook. No automatic POST retry was attempted.');}
if(!response.ok)throw new Error(`Cloudflare rejected the deploy hook (HTTP ${response.status}).`);
let result;try{result=await response.json();}catch{throw new Error('Invalid response from the deploy hook.');}
if(result.success!==true)throw new Error('Cloudflare did not accept the deploy hook.');
console.log(`Cloudflare accepted deployment. Waiting for revision ${revision.slice(0,7)} and snapshot ${catalog.generatedAt}.`);

const started=Date.now(),deadline=started+10*60*1000;
let deployed=false;
while(Date.now()<deadline){
  try{
    const query=`?verify=${revision}-${Date.now()}`;
    const get=async path=>{const r=await fetch(site+path+query,{cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Not available');return r.json();};
    const meta=await get('/build-meta.json');
    if(meta.revision===revision&&meta.generatedAt===catalog.generatedAt){
      const [issues,projects,status]=await Promise.all([get('/data/issues.json'),get('/data/projects.json'),get('/data/status.json')]);
      if(issues.generatedAt===catalog.generatedAt&&projects.generatedAt===catalog.generatedAt&&status.generatedAt===catalog.generatedAt&&issues.items.length===catalog.issues.length&&projects.items.length===catalog.projects.length){deployed=true;break;}
    }
  }catch{/* A previous deployment may still be serving. Continue the bounded check. */}
  const elapsed=Math.round((Date.now()-started)/1000);
  console.log(`Production has not reached the expected revision yet (${elapsed}s).`);
  await delay(Math.min(15000,Math.max(0,deadline-Date.now())));
}
if(!deployed)throw new Error('Cloudflare did not publish the expected revision and snapshot within 10 minutes. Inspect the Pages build log.');
console.log(`Verified production: ${site}/, revision ${revision.slice(0,7)}, ${catalog.issues.length} issues and ${catalog.projects.length} projects.`);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Cloudflare deployment verified\n\n- Site: ${site}/\n- Revision: ${revision}\n- Snapshot: ${catalog.generatedAt}\n- Issues: ${catalog.issues.length}\n- Projects: ${catalog.projects.length}\n\nThe production revision and all public data snapshots matched this run.\n`);
