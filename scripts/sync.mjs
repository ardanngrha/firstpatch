import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import JSON5 from 'json5';
import {site} from './config.mjs';
import {sourceDefinitions,mergeProject,repositoryFromUrl,issueType} from './lib.mjs';
import {applyDataPolicy} from './data-policy.mjs';

const root=new URL('../',import.meta.url);const now=new Date().toISOString();
const records=new Map();const reports=[];const issues=new Map();
let old=await readFile(new URL('data/catalog.json',root),'utf8').then(JSON.parse).catch(()=>null);
const agent='FirstPatch/1.0 (+https://github.com/ardanngrha/firstpatch)';
async function download(url){const r=await fetch(url,{headers:{'User-Agent':agent},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text();}
if(process.env.USE_PUBLISHED_FALLBACK==='true'){
  try{const origin=site+'/data/';const projects=JSON.parse(await download(origin+'projects.json'));const feed=JSON.parse(await download(origin+'issues.json'));const status=JSON.parse(await download(origin+'status.json'));if(Array.isArray(projects.items)&&Array.isArray(feed.items)&&feed.items.length)old={...old,projects:projects.items,issues:feed.items,sources:status.sources,issueCheckedAt:feed.checkedAt,repositoryCheckedAt:projects.checkedAt};}catch{console.log('Published fallback unavailable; using the committed snapshot if needed.');}
}
async function ingest(id,load){const count=records.size;try{const result=await load();reports.push({id,status:'ok',checkedAt:now,...result});console.log(`${id}: imported (${records.size-count} new records)`);}catch(error){
  const retained=(old?.projects||[]).filter(p=>p.sources.includes(id));for(const p of retained)mergeProject(records,{...p,sources:[id]});
  const previous=old?.sources?.find(s=>s.id===id);reports.push({id,status:retained.length?'retained':'unavailable',checkedAt:previous?.checkedAt||null,attemptedAt:now,error:error.message,count:retained.length});console.warn(`${id}: ${error.message}, retained ${retained.length}`);
}}
await ingest('good-first-issue',async()=>{const t=await download('https://raw.githubusercontent.com/DeepSourceCorp/good-first-issue/master/data/repositories.toml');const list=[...t.matchAll(/['"]github\.com\/([^'"\s]+)['"]/g)].map(m=>m[1]);if(list.length<10)throw new Error('Unexpected catalogue format');for(const repo of list)mergeProject(records,{repo,sources:['good-first-issue']});return {count:list.length,coverage:'Complete public seed list'};});
await ingest('first-contributions',async()=>{const t=await download('https://raw.githubusercontent.com/firstcontributions/firstcontributions.github.io/main/src/data/projects.js');const start=t.indexOf('['),end=t.lastIndexOf(']');const list=JSON5.parse(t.slice(start,end+1));if(!Array.isArray(list)||list.length<10)throw new Error('Unexpected project list');for(const p of list)mergeProject(records,{name:p.name,url:p.projectLink,description:p.description,tags:p.tags,sources:['first-contributions']});return {count:list.length,coverage:'Complete published project list'};});
await ingest('up-for-grabs',async()=>{const data=JSON.parse(await download('https://up-for-grabs.net/javascripts/projects.json'));const list=Object.values(data);if(list.length<10)throw new Error('Unexpected project catalogue');for(const p of list)mergeProject(records,{repo:repositoryFromUrl(p.upforgrabs?.link),url:p.site,name:p.name,description:p.desc,tags:p.tags,sources:['up-for-grabs'],labels:[p.upforgrabs?.name].filter(Boolean),issueUrl:p.upforgrabs?.link});return {count:list.length,coverage:'Complete published JSON catalogue'};});
for(const id of ['codetriage','goodfirstissue-org','firstissue-dev','first-timers-only'])reports.push({id,status:'linked',checkedAt:null,count:0,coverage:sourceDefinitions.find(s=>s.id===id).method});

function graphql(query,variables={},partial=false){
  const payload=JSON.stringify({query,variables});let output;
  try{output=execFileSync('gh',['api','graphql','--input','-'],{input:payload,encoding:'utf8',maxBuffer:30*1024*1024,timeout:45000,stdio:['pipe','pipe','pipe']});}
  catch(error){if(!partial||!error.stdout)throw error;output=error.stdout.toString();}
  const result=JSON.parse(output);
  if(result.errors?.length&&!partial)throw new Error(result.errors.map(e=>e.message).join('; '));
  if(!result.data)throw new Error(result.errors?.map(e=>e.message).join('; ')||'No GitHub metadata returned');
  return result.data;
}
const query=`query($q:String!,$after:String){search(query:$q,type:ISSUE,first:100,after:$after){pageInfo{hasNextPage endCursor} nodes{... on Issue{id number title url state createdAt updatedAt comments{totalCount} assignees(first:1){totalCount} labels(first:20){nodes{name}} repository{nameWithOwner url isArchived isFork pushedAt stargazerCount forkCount primaryLanguage{name} licenseInfo{spdxId name url} defaultBranchRef{name} contributing:object(expression:"HEAD:CONTRIBUTING.md"){__typename}}}}}}`;
const languages=['TypeScript','JavaScript','Python','Go','Rust','Java','C++','Ruby','C#','Swift','Dart'];
const queries=[
  ...languages.map(l=>`is:issue is:open is:public archived:false label:"good first issue" language:"${l}" sort:updated-desc`),
  'is:issue is:open is:public archived:false label:"first-timers-only" sort:updated-desc'
];
// Check directory-listed Dart/Flutter projects directly as well: busy global
// language searches can otherwise crowd these projects out of the 100-item sample.
const targetedRepos=[...records.values()].filter(p=>p.repo&&(p.sources.includes('first-contributions')||p.tags.some(t=>/^(dart|flutter)$/i.test(t))||/flutter/i.test(p.repo))).map(p=>p.repo);
for(let start=0;start<targetedRepos.length;start+=20)queries.push(`is:issue is:open is:public archived:false label:"good first issue" ${targetedRepos.slice(start,start+20).map(r=>`repo:${r}`).join(' ')} sort:updated-desc`);
let successful=0;const errors=[];
for(const q of queries){try{const d=graphql(query,{q,after:null});successful++;for(const item of d.search.nodes){if(!item.id||item.state!=='OPEN'||item.repository.isArchived)continue;const r=item.repository;const p=records.get(r.nameWithOwner.toLowerCase());const labels=item.labels.nodes.map(l=>l.name);const guide=labels.some(l=>l.toLowerCase()==='first-timers-only');const sourceIds=[...new Set([...(p?.sources||[]),'github',...(guide?['first-timers-only']:[])])];
    issues.set(item.id,{id:item.id,number:item.number,title:item.title,url:item.url,repo:r.nameWithOwner,repoUrl:r.url,repoDescription:p?.description||'',language:r.primaryLanguage?.name||'Other',labels,type:issueType(labels),assignees:item.assignees.totalCount,comments:item.comments.totalCount,createdAt:item.createdAt,updatedAt:item.updatedAt,checkedAt:now,sources:sourceIds,stars:r.stargazerCount,forks:r.forkCount,repoPushedAt:r.pushedAt,license:r.licenseInfo?.spdxId||null,licenseName:r.licenseInfo?.name||null,licenseUrl:r.licenseInfo?.url||null,hasContributing:!!r.contributing,branch:r.defaultBranchRef?.name||'HEAD',contributingUrl:r.contributing?`${r.url}/blob/${encodeURIComponent(r.defaultBranchRef?.name||'HEAD')}/CONTRIBUTING.md`:`${r.url}/contribute`,state:'open'});
  }console.log(`GitHub: ${q.match(/language:"([^"]+)/)?.[1]||(q.includes('repo:')?'Directory project batch':'first-timers-only')} checked`);}catch(e){errors.push(e.message);console.warn(`GitHub: ${e.message}`);}}
if(!successful){if(!old?.issues?.length)throw new Error('No issue data could be verified; refusing to publish an empty initial feed.');for(const i of old.issues)issues.set(i.id,i);}
const previousCount=old?.issues?.length||0;
const current=[...issues.values()].filter(i=>i.sources.some(s=>s!=='github')).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
for(const i of current){const p=records.get(i.repo.toLowerCase());if(p){p.language=i.language;p.stars=i.stars;p.description ||= i.repoDescription;p.checkedAt=i.checkedAt;}}
// Resolve repository facts independently of the bounded beginner-issue feed.
// No descriptions, issue bodies, profiles or contributor locations are requested.
const repositoryReport={checked:0,retained:0,unavailable:0,external:0,attemptedAt:now};
const priorProjects=new Map((old?.projects||[]).filter(p=>p.repo).map(p=>[p.repo.toLowerCase(),p]));
const metadataFields=['stars','forks','openIssues','language','repoPushedAt','license','licenseName','licenseUrl','hasContributing','metadataCheckedAt'];
const githubProjects=[...records.values()].filter(p=>p.repo);
for(const p of records.values())if(!p.repo){p.metadataStatus='external';repositoryReport.external++;}
for(let start=0;start<githubProjects.length;start+=40){
  const batch=githubProjects.slice(start,start+40);
  const fields='isPrivate stargazerCount forkCount pushedAt issues(states:OPEN){totalCount} primaryLanguage{name} licenseInfo{spdxId name url} contributing:object(expression:"HEAD:CONTRIBUTING.md"){__typename}';
  const query=`query{${batch.map((p,n)=>{const [owner,name]=p.repo.split('/');return `r${n}:repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}){${fields}}`;}).join(' ')}}`;
  let data={};try{data=graphql(query,{},true);}catch(error){console.warn(`Repository batch ${start/40+1}: ${error.message}`);}
  const metadataCheckedAt=new Date().toISOString();
  for(const [n,p] of batch.entries()){
    const r=data[`r${n}`];
    if(r&&!r.isPrivate){Object.assign(p,{stars:r.stargazerCount,forks:r.forkCount,openIssues:r.issues.totalCount,language:r.primaryLanguage?.name||null,repoPushedAt:r.pushedAt,license:r.licenseInfo?.spdxId||null,licenseName:r.licenseInfo?.name||null,licenseUrl:r.licenseInfo?.url||null,hasContributing:!!r.contributing,metadataCheckedAt,metadataStatus:'ok'});repositoryReport.checked++;}
    else{
      const previous=priorProjects.get(p.repo.toLowerCase());
      if(!r?.isPrivate&&previous?.metadataCheckedAt){for(const key of metadataFields)p[key]=previous[key];p.metadataStatus='retained';repositoryReport.retained++;}
      else{for(const key of metadataFields)p[key]=null;p.metadataStatus='unavailable';repositoryReport.unavailable++;}
    }
  }
  console.log(`Repository metadata: ${Math.min(start+40,githubProjects.length)}/${githubProjects.length} checked`);
}
reports.push({id:'github',status:successful===queries.length&&!repositoryReport.retained&&!repositoryReport.unavailable?'ok':successful?'partial':'retained',checkedAt:successful?now:old?.sources?.find(s=>s.id==='github')?.checkedAt||null,attemptedAt:now,count:current.length,repositories:repositoryReport,coverage:`Up to 100 recent open issues per language across ${languages.length} languages, including Dart for Flutter projects, extra batches of First Contributions and directory-listed Dart/Flutter projects, and the first-timers-only label. Only directory-listed projects or first-timers-only issues enter the feed. Repository facts are checked separately across the full GitHub project directory. Not an exhaustive GitHub mirror.`,errors});
const projects=[...records.values()].sort((a,b)=>(a.repo||a.name).localeCompare(b.repo||b.name));
const catalog=applyDataPolicy({generatedAt:now,issueCheckedAt:successful?now:old?.issueCheckedAt||null,repositoryCheckedAt:repositoryReport.checked?new Date().toISOString():old?.repositoryCheckedAt||null,previousIssueCount:previousCount,issues:current,projects,sources:reports,scope:'Licensed catalogue aggregation plus bounded official GitHub issue metadata and directory repository facts. GitHub remains authoritative. No private feeds, issue bodies, user profiles or contact details are imported.'});
await mkdir(new URL('data/',root),{recursive:true});const target=new URL('data/catalog.json',root);await writeFile(target,JSON.stringify(catalog,null,2)+'\n');
console.log(`Saved ${projects.length} projects, ${current.length} checked open issues. Sources: ${reports.map(s=>`${s.id}=${s.status}`).join(', ')}`);
if(errors.length||reports.some(s=>['unavailable','retained'].includes(s.status)))process.exitCode=2;
