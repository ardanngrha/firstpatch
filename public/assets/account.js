import {externalLinks} from './links.mjs';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const page=document.querySelector('#account-page'),status=document.querySelector('#account-status');
const retry=document.createElement('button');retry.type='button';retry.className='button secondary';retry.textContent='Try account again';retry.hidden=true;retry.addEventListener('click',()=>location.reload());if(status)status.after(retry);
let account=null,saved=[],links=[],preferences={theme:'system',presets:[]},visible=30;
const idMap=new Map();
const authHint=()=>document.cookie.split(';').some(s=>s.trim()==='fp-signed-in=1');
const announce=message=>{const box=status||document.querySelector('#account-feedback');if(box){box.textContent=message;box.hidden=false;}};
export async function api(path,options={}){
  let response;
  try{response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json','X-FirstPatch':'1'}:{}),...options.headers}});}
  catch{throw new Error('We couldn’t reach account services. Your saved work is unchanged. Please try again.');}
  let value;
  try{value=await response.json();}catch{throw new Error('Account services are temporarily unavailable. Public browsing is still available.');}
  if(!response.ok){const error=new Error(value.error||'Please try again.');error.status=response.status;throw error;}
  return value;
}
const post=(path,body,method='POST')=>api(path,{method,body:JSON.stringify(body)});
const date=value=>value?new Date(value).toLocaleDateString('en',{year:'numeric',month:'short',day:'numeric'}):'Not checked';
const setTheme=value=>{document.cookie=`fp-theme=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;const dark=value==='dark'||value==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.dispatchEvent(new CustomEvent('firstpatch-theme',{detail:dark}));};
const safeNext=value=>{try{const u=new URL(value||'/',location.origin);return u.origin===location.origin&&!/^\/(api|auth)\//.test(u.pathname)?u.pathname+u.search+u.hash:'/';}catch{return '/';}};
const html=value=>externalLinks(value,location.origin);
function openSignIn(issueId){const dialog=document.querySelector('#signin-dialog');const next=location.pathname+location.search;document.querySelector('#github-signin').href='/auth/start?next='+encodeURIComponent(next)+(issueId?'&save='+encodeURIComponent(issueId):'');dialog.showModal();}
document.addEventListener('click',async event=>{
  const signIn=event.target.closest('[data-sign-in]');if(signIn){event.preventDefault();openSignIn();return;}
  const button=event.target.closest('[data-save-issue]');if(!button)return;
  event.preventDefault();event.stopPropagation();const issueId=button.dataset.saveIssue;
  if(!account){openSignIn(issueId);return;}
  button.disabled=true;
  try{const row=idMap.get(issueId);if(row){await post('/api/saved/'+row.id,{},'DELETE');idMap.delete(issueId);announce('Removed from Saved.');}else{await post('/api/saved',{issue_id:issueId});await loadSaves();announce('Saved to your private shortlist.');}paintSaveButtons();}catch(error){announce(error.message);}finally{button.disabled=false;}
});
function paintSaveButtons(){document.querySelectorAll('[data-save-issue]').forEach(button=>{button.hidden=false;const selected=idMap.has(button.dataset.saveIssue);button.setAttribute('aria-pressed',String(selected));button.querySelector('span').textContent=selected?'Saved':'Save issue';});}
document.addEventListener('firstpatch-results',paintSaveButtons);
async function loadSaves(){saved=(await api('/api/saved'+(page?.dataset.kind==='saved'?'':'?summary=1'))).items;idMap.clear();saved.forEach(row=>idMap.set(row.issue_id,row));}
function savedMarkup(row){return `<article class="saved-issue" data-saved-id="${e(row.id)}"><div class="saved-heading"><div><p class="repo-name">${e(row.repository)}</p><h2><a href="${e(row.issue_url)}">${e(row.title)}</a></h2><p class="muted">${e(row.language)} · Saved ${date(row.created_at)}</p></div><span class="personal-status">${row.status==='in_progress'?'In progress':row.status==='archived'?'Archived':'Saved'}</span></div><details class="saved-details"><summary>Notes & contribution tracking</summary><form class="saved-edit"><label>Personal status<select name="status">${[['saved','Saved'],['in_progress','In progress'],['archived','Archived']].map(([value,label])=>`<option value="${value}"${row.status===value?' selected':''}>${label}</option>`).join('')}</select></label><label>Private note <span class="muted">(up to 1,000 characters)</span><textarea name="note" maxlength="1000" rows="3">${e(row.note)}</textarea></label><button class="button secondary">Save changes</button></form><form class="pr-link"><h3>Track your pull request</h3><label>Public GitHub PR URL<input name="url" type="url" required placeholder="https://github.com/owner/repo/pull/123" maxlength="300"></label><button class="button secondary">Verify & link PR</button><p class="muted">We check your authorship and the target repository. You provide the link to this issue.</p></form><button class="text-button remove-save" type="button">Remove saved issue and its private note</button></details><p class="row-feedback" role="status" aria-live="polite"></p></article>`;}
function renderSaved(){const q=document.querySelector('#saved-search').value.trim().toLowerCase(),state=document.querySelector('#saved-status').value;const found=saved.filter(row=>(!state||row.status===state)&&[row.title,row.repository,row.note].some(s=>s.toLowerCase().includes(q)));document.querySelector('#saved-results').innerHTML=html(found.length?found.slice(0,visible).map(savedMarkup).join(''):`<div class="empty-state"><h2>${saved.length?'No saves match those filters.':'Leave yourself a place to start.'}</h2><p>${saved.length?'Try a broader search or another status.':'Save an issue from the directory. Your shortlist and notes will be here on any device.'}</p><a class="button primary" href="/">Find an issue</a></div>`);document.querySelector('#saved-more').hidden=found.length<=visible;}
function renderProgress(){const cutoff=new Date();cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);const facts=[...new Map(links.filter(l=>l.fp_pr_facts).map(l=>[l.fp_pr_facts.url,l.fp_pr_facts])).values()].filter(f=>new Date(f.opened_at)>=cutoff);const summary=document.querySelector('#progress-summary');summary.hidden=false;summary.innerHTML=[['Submitted',facts.length],['Open',facts.filter(f=>f.state==='open').length],['Merged',facts.filter(f=>f.state==='merged').length],['Closed without merge',facts.filter(f=>f.state==='closed').length],['Projects',new Set(facts.map(f=>f.repository.toLowerCase())).size]].map(([label,count])=>`<div><strong>${count}</strong><span>${label}</span></div>`).join('');document.querySelector('#progress-results').innerHTML=html(facts.length?facts.map(f=>`<article class="tracked-pr"><div><p class="repo-name">${e(f.repository)}</p><h2><a href="${e(f.url)}">${e(f.title)}</a></h2><p class="muted">Opened ${date(f.opened_at)} · Checked ${date(f.checked_at)} · User-linked issue relationship</p></div><span class="personal-status">${e(f.state)}</span></article>`).join(''):'<div class="empty-state"><h2>Your next patch can start here.</h2><p>Link a PR from a saved issue to follow its status. Historical GitHub activity is not automatically imported.</p><a class="button primary" href="/saved/">Open your shortlist</a></div>');}
async function savePreferences(){await post('/api/preferences',preferences,'PATCH');}
function decoratePRs(){document.querySelectorAll('.tracked-pr').forEach(row=>{const button=document.createElement('button');button.type='button';button.className='text-button';button.dataset.unlinkPr=row.querySelector('a').href;button.textContent='Unlink PR';button.setAttribute('aria-label','Remove this PR from FirstPatch tracking');row.append(button);});}
document.addEventListener('firstpatch-theme-choice',async event=>{if(!account)return;const next={...preferences,theme:event.detail};try{await post('/api/preferences',next,'PATCH');preferences=next;}catch(error){announce('Theme changed on this browser, but account sync failed. '+error.message);}});
function renderPresets(){document.querySelector('#preset-list').innerHTML=preferences.presets.length?preferences.presets.map((p,i)=>`<li><a href="${e(safeNext(p.url))}">${e(p.name)}</a><button class="text-button" data-remove-preset="${i}">Remove</button></li>`).join(''):'<li>No saved searches yet.</li>';}
async function ready(){
  if(!page&&!authHint())return;
  try{
    const result=await api('/api/session');account=result.user;
    if(!account){if(page){document.querySelector('#account-gate').hidden=false;announce(new URLSearchParams(location.search).has('auth')?'Sign-in was cancelled or expired. You can try again.':'Sign in to open your private workspace.');}return;}
    preferences=result.preferences||preferences;setTheme(preferences.theme);
    const nav=document.querySelector('#account-nav');nav.removeAttribute('data-sign-in');nav.href='/settings/';nav.textContent=account.username;
    if(!page||page.dataset.kind==='saved'){await loadSaves();paintSaveButtons();}
    const saveSearch=document.querySelector('#save-search');if(saveSearch)saveSearch.hidden=false;
    if(!page)return;
    document.querySelector('#account-content').hidden=false;announce('Signed in as '+account.username+'. Your workspace is private.');
    if(page.dataset.kind==='return'){
      const params=new URLSearchParams(location.search),issueId=params.get('save');if(issueId)await post('/api/saved',{issue_id:issueId});location.replace(safeNext(params.get('next')));return;
    }
    if(page.dataset.kind==='saved'){document.querySelector('.account-tools').hidden=false;renderSaved();}
    if(page.dataset.kind==='progress'){links=(await api('/api/prs')).items;renderProgress();decoratePRs();}
    if(page.dataset.kind==='settings'){document.querySelector('#settings-content').hidden=false;document.querySelector('#theme-form').elements.theme.value=preferences.theme;renderPresets();}
  }catch(error){announce(error.message);if(page){retry.hidden=false;if(!account)document.querySelector('#account-gate').hidden=false;}}
}
page?.addEventListener('input',event=>{if(['saved-search','saved-status'].includes(event.target.id)){visible=30;renderSaved();}});
page?.addEventListener('change',event=>{if(event.target.id==='saved-status'){visible=30;renderSaved();}});
page?.addEventListener('click',async event=>{
  const unlink=event.target.closest('[data-unlink-pr]');if(unlink){unlink.disabled=true;try{await post('/api/prs',{url:unlink.dataset.unlinkPr},'DELETE');links=links.filter(row=>row.fp_pr_facts?.url!==unlink.dataset.unlinkPr);renderProgress();decoratePRs();announce('Removed from your FirstPatch tracking.');}catch(error){announce(error.message);unlink.disabled=false;}return;}
  const remove=event.target.closest('.remove-save'),preset=event.target.closest('[data-remove-preset]');
  try{if(remove){remove.disabled=true;await post('/api/saved/'+remove.closest('[data-saved-id]').dataset.savedId,{},'DELETE');await loadSaves();renderSaved();announce('Removed saved issue and its private note.');}
    if(event.target.id==='saved-more'){visible+=30;renderSaved();}
    if(preset){const old=preferences.presets;preferences={...preferences,presets:old.filter((_,i)=>i!==Number(preset.dataset.removePreset))};try{await savePreferences();renderPresets();}catch(error){preferences={...preferences,presets:old};throw error;}}
    if(event.target.id==='export-data'){const data=await api('/api/export');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='firstpatch-personal-data.json';a.click();URL.revokeObjectURL(url);}
    if(event.target.id==='sign-out'){await post('/api/logout',{});location.replace('/saved/');}
  }catch(error){announce(error.message);if(remove)remove.disabled=false;}
});
page?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target,button=form.querySelector('button');button.disabled=true;
  const rowNode=form.closest('[data-saved-id]'),feedback=rowNode?.querySelector('.row-feedback');
  try{
    if(form.classList.contains('saved-edit')){const row=saved.find(r=>r.id===rowNode.dataset.savedId);const result=await post('/api/saved/'+row.id,{status:form.elements.status.value,note:form.elements.note.value,updated_at:row.updated_at},'PATCH');Object.assign(row,result.item);feedback.textContent='Changes saved.';rowNode.querySelector('.personal-status').textContent=row.status==='in_progress'?'In progress':row.status==='archived'?'Archived':'Saved';}
    if(form.classList.contains('pr-link')){await post('/api/prs',{saved_id:rowNode.dataset.savedId,url:form.elements.url.value});feedback.textContent='PR verified and linked. Open Progress to follow its status.';form.reset();}
    if(form.id==='theme-form'){const next={...preferences,theme:form.elements.theme.value};await post('/api/preferences',next,'PATCH');preferences=next;setTheme(preferences.theme);announce('Appearance saved across devices.');}
    if(form.id==='delete-account'){await post('/api/account',{confirm:form.elements.confirm.value},'DELETE');location.replace('/saved/?deleted=1');}
  }catch(error){if(feedback)feedback.textContent=error.message;else announce(error.message);}finally{button.disabled=false;}
});
document.querySelector('#save-search')?.addEventListener('click',()=>document.querySelector('#search-dialog').showModal());
document.querySelector('#save-search-form')?.addEventListener('submit',async event=>{event.preventDefault();const name=event.target.elements.name.value.trim();if(!name)return;try{const next={...preferences,presets:[...preferences.presets,{name,url:location.pathname+location.search}]};await post('/api/preferences',next,'PATCH');preferences=next;document.querySelector('#search-dialog').close();announce('Search saved. Find it in Settings.');event.target.reset();}catch(error){document.querySelector('#search-dialog-status').textContent=error.message;}});
paintSaveButtons();
await ready();
