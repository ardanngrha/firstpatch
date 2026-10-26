// Shared by pre-rendered HTML and browser filtering; no visitor API calls.
import {externalLinks} from './links.mjs';
export const filterKeys=['q','language','type','unassigned','source','minStars','maxStars','minForks','maxForks','pushDays','issueDays','maxComments','license','label','hasGuide','tag','onePerRepo','sort'];
export const repoFilterKeys=['minStars','maxStars','minForks','maxForks','license'];
export const advancedKeys=['pushDays','issueDays','maxComments','label','hasGuide','tag','onePerRepo'];
const names={'good-first-issue':'Good First Issue','first-contributions':'First Contributions','up-for-grabs':'Up For Grabs','first-timers-only':'First Timers Only','github':'GitHub'};
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const known=value=>Number.isInteger(value)&&value>=0;
export const count=value=>known(value)?new Intl.NumberFormat('en').format(value):'Not checked';
const metric=(value,label,unknown)=>known(value)?`${count(value)} ${label}${value===1?'':'s'}`:unknown;
export const licenseId=i=>i.license&&i.license!=='NOASSERTION'?i.license:null;
const time=value=>value&&!Number.isNaN(Date.parse(value))?`<time datetime="${esc(value)}" title="${esc(value)}">${new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value))}</time>`:'Not checked';

function within(value,days,asOf){
  if(!days)return true;
  const t=Date.parse(value),end=Date.parse(asOf);
  return Number.isFinite(t)&&Number.isFinite(end)&&t<=end&&t>=end-Number(days)*86400000;
}
function threshold(value,limit,upper=false){
  if(limit===''||limit===undefined)return true;
  const n=Number(limit);
  return Number.isFinite(n)&&n>=0&&known(value)&&(upper?value<=n:value>=n);
}
export function filterIssues(items,values={},asOf){
  const q=(values.q||'').trim().toLowerCase();
  return items.filter(i=>{
    const licence=licenseId(i);
    const searchable=[i.title,i.repo,i.repoDescription,i.language,licence,...i.labels].join(' ').toLowerCase();
    return (!q||searchable.includes(q))&&(!values.language||i.language===values.language)&&
      (!values.tag||(i.tags||[]).some(t=>t.toLowerCase()===values.tag.toLowerCase()))&&(!values.type||i.type===values.type)&&(!values.source||i.sources.includes(values.source))&&
      (!values.unassigned||i.assignees===0)&&(!values.hasGuide||i.hasContributing===true)&&
      (!values.label||i.labels.some(l=>l.toLowerCase()===values.label.toLowerCase()))&&
      (!values.license||(values.license==='identified'?!!licence:values.license==='unknown'?!licence:licence===values.license))&&
      threshold(i.stars,values.minStars)&&threshold(i.stars,values.maxStars,true)&&
      threshold(i.forks,values.minForks)&&threshold(i.forks,values.maxForks,true)&&threshold(i.comments,values.maxComments,true)&&
      within(i.repoPushedAt,values.pushDays,asOf)&&within(i.updatedAt,values.issueDays,asOf);
  });
}
export function filterProjects(items,values={},asOf){
  const q=(values.q||'').trim().toLowerCase();
  return items.filter(p=>{
    const licence=licenseId(p);
    return (!q||[p.repo,p.name,p.description,p.language,licence,...(p.tags||[])].join(' ').toLowerCase().includes(q))&&
      (!values.tag||(p.tags||[]).some(t=>t.toLowerCase()===values.tag.toLowerCase()))&&(!values.language||p.language===values.language)&&(!values.source||p.sources.includes(values.source))&&
      (!values.license||(values.license==='identified'?!!licence:values.license==='unknown'?!licence:licence===values.license))&&
      (!values.hasGuide||p.hasContributing===true)&&threshold(p.stars,values.minStars)&&threshold(p.stars,values.maxStars,true)&&
      threshold(p.forks,values.minForks)&&threshold(p.forks,values.maxForks,true)&&within(p.repoPushedAt,values.pushDays,asOf);
  });
}
export function diversifyIssues(items){const seen=new Set();return items.filter(i=>{const key=i.repo.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});}
export function sortIssues(items,sort='updated'){
  const stamp=v=>Number.isFinite(Date.parse(v))?Date.parse(v):-Infinity;
  return [...items].sort((a,b)=>{
    if(sort==='name')return (a.repo||a.name).localeCompare(b.repo||b.name);
    let order=0;
    if(sort==='stars'||sort==='forks')order=(known(b[sort])?b[sort]:-1)-(known(a[sort])?a[sort]:-1);
    else if(sort==='push')order=stamp(b.repoPushedAt)-stamp(a.repoPushedAt);
    else if(sort==='comments')order=(known(a.comments)?a.comments:Infinity)-(known(b.comments)?b.comments:Infinity);
    else order=stamp(sort==='created'?b.createdAt:b.updatedAt)-stamp(sort==='created'?a.createdAt:a.updatedAt);
    return (Number.isNaN(order)?0:order)||stamp(b.updatedAt)-stamp(a.updatedAt)||String(a.id||a.repo||a.url).localeCompare(String(b.id||b.repo||b.url));
  });
}
export function issueMarkup(i,{base='',open=false,siteOrigin='https://firstpatch.pages.dev'}={}){
  const icon=name=>`<img class="icon" src="${esc(base)}/assets/icons/${name}.svg" width="18" height="18" alt="" aria-hidden="true">`;
  const sources=i.sources.filter(s=>s!=='github'&&s!=='first-timers-only');
  const source=sources.length?sources.map(s=>names[s]||s).join(', '):'GitHub label search';
  const licence=licenseId(i);
  const licenseLink=licence&&safe(i.licenseUrl)?`<a href="${esc(safe(i.licenseUrl))}">${esc(licence)}</a>`:esc(licence||'Not identified');
  return externalLinks(`<details class="issue" data-id="${esc(i.id)}"${open?' open':''}>
    <summary>
      <div class="repo-cell"><div>
        <span class="repo-name">${esc(i.repo.replace('/',' / '))}</span>
        <span class="repo-language">${esc(i.language)}<span class="assignment">${i.assignees?'Assigned':'Unassigned'}</span></span>
        <span class="repo-stats"><span>${icon('star')}${metric(i.stars,'star','Stars not checked')}</span><span>${icon('git-fork')}${metric(i.forks,'fork','Forks not checked')}</span></span>
        <span class="repo-license">${icon('scales')}${esc(licence||'License not identified')}</span>
      </div></div>
      <div class="issue-cell"><h2>${esc(i.title)}</h2>
        ${i.repoDescription?`<p>${esc(i.repoDescription)}</p>`:''}
        <div class="labels">${i.labels.filter(l=>l.length<35).slice(0,3).map(l=>`<span>${esc(l)}</span>`).join('')}</div>
        <span class="issue-comments"><span>${icon('chat-circle-text')}${known(i.comments)?count(i.comments)+(i.comments===1?' comment':' comments'):'Comment count not checked'}</span> <span>${icon('circle-dashed')}Issue #${esc(i.number)}</span></span>
      </div>
      <div class="source-cell"><span>Issue updated ${time(i.updatedAt)}</span><span>Code pushed ${time(i.repoPushedAt)}</span><span class="checked">Checked ${time(i.checkedAt)}</span><span title="${esc(source)}">${esc(source)}</span></div>
      <img class="icon disclosure" src="${esc(base)}/assets/icons/caret-down.svg" width="18" height="18" alt="" aria-hidden="true">
    </summary>
    <div class="issue-detail">
      <section><h3>Project context</h3><dl class="issue-facts">
        <div><dt>Issue opened</dt><dd>${time(i.createdAt)}</dd></div>
        <div><dt>Repository license</dt><dd>${licenseLink}</dd></div>
        <div><dt>Contribution guide</dt><dd>${i.hasContributing===true?'Root CONTRIBUTING.md detected':i.hasContributing===false?'Root CONTRIBUTING.md not detected':'Not checked'}</dd></div>
      </dl><a class="text-link" href="${esc(safe(i.url))}">Read the original description and discussion ${icon('arrow-up-right')}</a></section>
      <section><h3>Before you start</h3><ul><li>${i.assignees?'This issue has an assignee. Check with the maintainer before starting.':'No assignee at the last check. Read the comments for work already in progress.'}</li>
        <li><a href="${esc(safe(i.contributingUrl))}">Read the project’s contribution guidance</a></li>
        <li>Stars and recent pushes describe the repository, not task difficulty or maintainer response time.</li></ul></section>
      <div class="issue-actions"><button type="button" class="button secondary save-issue" data-save-issue="${esc(i.id)}" aria-pressed="false" hidden><img class="icon" src="${esc(base)}/assets/icons/bookmark-simple.svg" width="18" height="18" alt="" aria-hidden="true"><span>Save issue</span></button><a class="button primary" href="${esc(safe(i.url))}">${icon('github-logo')}View on GitHub ${icon('arrow-up-right')}</a></div>
    </div>
  </details>`,siteOrigin);
}
export function projectMarkup(p,{base='',siteOrigin='https://firstpatch.pages.dev'}={}){
  const icon=name=>`<img class="icon" src="${esc(base)}/assets/icons/${name}.svg" width="16" height="16" alt="" aria-hidden="true">`;
  const url=safe(p.url),task=safe(p.issueUrl)||(p.repo?url+'/contribute':url),licence=licenseId(p);
  const licenseLink=licence&&safe(p.licenseUrl)?`<a href="${esc(safe(p.licenseUrl))}">${esc(licence)}</a>`:esc(licence||'License not identified');
  return externalLinks(`<article class="project"><div class="project-info"><h2><a href="${esc(url)}">${esc(p.repo||p.name)}</a></h2><p>${esc(p.description||'Read the project README and contribution instructions at its original source.')}</p>
    <div class="project-stats"><span>${icon('code')}${esc(p.language||(p.metadataCheckedAt?'No primary language detected':'Language not checked'))}</span><span>${icon('star')}${metric(p.stars,'star','Stars not checked')}</span><span>${icon('git-fork')}${metric(p.forks,'fork','Forks not checked')}</span><span>${icon('circle-dashed')}${metric(p.openIssues,'open issue','Issue count not checked')}</span><span>${icon('scales')}${licenseLink}</span></div>
    <div class="project-meta"><span>Code pushed ${time(p.repoPushedAt)}</span><span>${p.metadataCheckedAt?(p.metadataStatus==='retained'?'Previous metadata checked ':'Metadata checked ')+time(p.metadataCheckedAt):p.repo?'Repository metadata unavailable':'External host; GitHub metadata unavailable'}</span><span>${p.sources.map(s=>esc(names[s]||s)).join(' · ')}</span></div>
    </div><a class="text-link" href="${esc(task)}">${p.repo?'Find contribution tasks':'Visit project'} ${icon('arrow-up-right')}</a></article>`,siteOrigin);
}
