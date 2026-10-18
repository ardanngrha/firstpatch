import {sourceDefinitions} from './lib.mjs';

export const catalogueSources=sourceDefinitions.filter(s=>s.kind==='catalogue');
const catalogueIds=new Set(catalogueSources.map(s=>s.id));
export const projectReuse={
  license:'CC-BY-SA-4.0',
  licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
  attributionUrl:'/data/attribution.json',
  scope:'Derived project catalogue only. GitHub issue text, repository code and trademarks are not relicensed.',
  modifications:'Canonicalized repository references, deduplicated records, combined source membership, retained catalogue descriptions/tags, and added separately identified GitHub metadata.',
  attribution:catalogueSources.map(s=>({id:s.id,name:s.name,url:s.dataUrl,license:s.license,notice:s.id==='up-for-grabs'?'Up-For-Grabs contributors':'See distributed upstream MIT notice'}))
};

// Apply to new imports AND retained/published fallbacks, so a failed refresh
// cannot silently bring back retired HTML sources or copied issue bodies.
export function applyDataPolicy(catalog){
  const projects=(catalog.projects||[]).map(p=>({...p,sources:p.sources.filter(s=>catalogueIds.has(s))})).filter(p=>p.sources.length);
  const byRepo=new Map(projects.filter(p=>p.repo).map(p=>[p.repo.toLowerCase(),p]));
  const issues=(catalog.issues||[]).filter(i=>byRepo.has(i.repo.toLowerCase())||i.labels.some(l=>l.toLowerCase()==='first-timers-only')).map(i=>{
    const {excerpt,body,bodyText,repoDescription,...metadata}=i;
    const p=byRepo.get(i.repo.toLowerCase());
    return {...metadata,repoDescription:p?.description||'',sources:[...(p?.sources||[]),'github',...(i.labels.some(l=>l.toLowerCase()==='first-timers-only')?['first-timers-only']:[])],forks:Number.isInteger(i.forks)&&i.forks>=0?i.forks:null};
  });
  return {...catalog,schemaVersion:2,projects,issues,sources:(catalog.sources||[]).map(s=>{
    const definition=sourceDefinitions.find(d=>d.id===s.id);
    return definition?.kind==='resource'?{id:s.id,status:'linked',checkedAt:null,count:0,coverage:definition.method}:s.id==='github'?{...s,count:issues.length}:s;
  }),catalogLicense:projectReuse,contentPolicy:'Licensed project catalogues plus bounded GitHub issue metadata. No issue bodies, comments, personal profiles, locations or HTML discovery catalogues are imported.'};
}
