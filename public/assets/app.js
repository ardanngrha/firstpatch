import {issueMarkup,projectMarkup,filterIssues,filterProjects,sortIssues,diversifyIssues,filterKeys,repoFilterKeys,advancedKeys} from './issues.mjs';

const $=selector=>document.querySelector(selector);
const themeButton=$('.theme-button');
function setTheme(dark){
  document.documentElement.dataset.theme=dark?'dark':'light';
  themeButton.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} theme`);
  themeButton.title=`Switch to ${dark?'light':'dark'} theme`;
  const img=themeButton.querySelector('img');img.src=img.src.replace(/(moon|sun)\.svg/,`${dark?'sun':'moon'}.svg`);
}
setTheme(document.documentElement.dataset.theme==='dark');themeButton.hidden=false;
document.addEventListener('firstpatch-theme',event=>setTheme(event.detail));
themeButton.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';setTheme(dark);try{document.cookie=`fp-theme=${dark?'dark':'light'}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}catch{}});
themeButton.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('firstpatch-theme-choice',{detail:document.documentElement.dataset.theme})));

const pageNode=$('#page-data');
if(pageNode){
  const page=JSON.parse(pageNode.textContent);
  const isIssues=page.kind==='issues';
  const form=$(isIssues?'#issue-filters':'#project-filters');
  const input=form.elements.q;
  const status=$(isIssues?'#filter-status':'#project-status');
  const keys=isIssues?filterKeys:['q','source','language',...repoFilterKeys,'pushDays','hasGuide','tag','sort'];
  const extraKeys=isIssues?advancedKeys:['pushDays','hasGuide','tag'];
  const defaultSort=isIssues?'updated':'name';
  let all=page.initial,limit=page.size,offset=0,loaded=false,loading=false,timer;
  let asOf=page.generatedAt;
  const values=()=>Object.fromEntries(new FormData(form));
  const active=v=>keys.filter(k=>v[k]!==undefined&&v[k]!==''&&k!=='sort');
  function updateUrl(v){
    const params=new URLSearchParams();
    for(const key of keys)if(v[key]!==undefined&&v[key]!==''&&!(key==='sort'&&v[key]===defaultSort))params.set(key,v[key]);
    history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
  }
  function restore(){
    const params=new URLSearchParams(location.search);
    for(const name of keys){
      const field=form.elements[name];if(!field)continue;
      const value=params.get(name);
      if(field.type==='checkbox')field.checked=value==='on';
      else field.value=value??(name==='language'?(page.language||''):name==='sort'?defaultSort:'');
    }
    const v=values();
    if(extraKeys.some(k=>v[k]!==undefined&&v[k]!==''))$('#advanced-filters').open=true;
  }
  function render({writeUrl=true}={}){
    const v=values();let found;
    if(isIssues){
      found=sortIssues(filterIssues(all,v,asOf),v.sort);if(v.onePerRepo)found=diversifyIssues(found);
      const openIds=new Set([...document.querySelectorAll('.issue[open]')].map(el=>el.dataset.id));
      $('#issue-results').innerHTML=found.slice(offset,offset+limit).map(i=>issueMarkup(i,{base:page.base,siteOrigin:page.siteOrigin,open:openIds.has(i.id)})).join('');
      $('#result-count').textContent=`${found.length} open ${found.length===1?'issue':'issues'}`;
      $('#clear-filters').hidden=!active(v).length;
      $('#empty-results').hidden=found.length>0||!loaded;
      $('#load-more').hidden=!loaded||offset+limit>=found.length;
      $('#pagination').hidden=loaded;
    }else{
      found=sortIssues(filterProjects(all,v,asOf),v.sort||defaultSort);
      $('#project-results').innerHTML=found.slice(offset,offset+limit).map(p=>projectMarkup(p,{base:page.base,siteOrigin:page.siteOrigin})).join('');
      $('#project-count').textContent=`${found.length} ${found.length===1?'project':'projects'}`;
      $('#project-empty').hidden=found.length>0||!loaded;
      $('#more-projects').hidden=!loaded||offset+limit>=found.length;
      $('#project-pagination').hidden=loaded;
      $('#clear-project-filters').hidden=!active(v).length;
    }
    const advancedCount=extraKeys.filter(k=>v[k]!==undefined&&v[k]!=='').length;
    $('#advanced-count').textContent=advancedCount?`${advancedCount} active`:'';
    $('#clear-repository').hidden=!repoFilterKeys.some(k=>v[k]!==undefined&&v[k]!=='');
    const shown=Math.max(0,Math.min(limit,found.length-offset));
    status.textContent=`${found.length} ${isIssues?'issues':'projects'} found. Showing ${shown}.${loaded?'':' Loading the full snapshot.'}`;
    if(writeUrl)updateUrl(v);
    document.dispatchEvent(new Event('firstpatch-results'));
  }
  function reset(){
    form.reset();form.elements.language.value='';
    limit=page.size;offset=0;render();input.focus();
  }
  form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(timer);limit=page.size;offset=0;render();});
  for(const field of form.elements){
    field.addEventListener('input',()=>{if(['search','number'].includes(field.type)){clearTimeout(timer);timer=setTimeout(()=>{limit=page.size;offset=0;render();},120);}});
    field.addEventListener('change',()=>{clearTimeout(timer);limit=page.size;offset=0;render();});
  }
  if(isIssues){
    $('#clear-filters').addEventListener('click',reset);$('#reset-empty').addEventListener('click',reset);
    $('#load-more').addEventListener('click',()=>{limit+=page.size;render();});$('#retry-data').addEventListener('click',load);
  }else{
    $('#reset-projects').addEventListener('click',reset);$('#clear-project-filters').addEventListener('click',reset);$('#more-projects').addEventListener('click',()=>{limit+=page.size;render();});$('#retry-projects').addEventListener('click',load);
  }
  $('#clear-repository').addEventListener('click',()=>{
    for(const key of repoFilterKeys)form.elements[key].value='';
    limit=page.size;offset=0;render();
  });
  $('#clear-advanced').addEventListener('click',()=>{
    for(const key of extraKeys){const field=form.elements[key];if(field.type==='checkbox')field.checked=false;else field.value='';}
    limit=page.size;offset=0;render();
  });
  window.addEventListener('popstate',()=>{restore();limit=page.size;offset=0;render({writeUrl:false});});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();input.focus();}});
  async function load(){
    if(loading)return;loading=true;
    const error=$(isIssues?'#data-error':'#project-error');error.hidden=true;
    $('#snapshot-loading').hidden=false;
    try{
      const response=await fetch(`${page.base}/data/${isIssues?'issues':'projects'}.json`,{signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error('Snapshot unavailable');
      const data=await response.json();if(!Array.isArray(data.items))throw new Error('Invalid snapshot');
      all=data.items;asOf=data.checkedAt||data.generatedAt;loaded=true;restore();
      offset=page.page>1&&!location.search?(page.page-1)*page.size:0;render({writeUrl:false});
    }catch{error.hidden=false;status.textContent='Could not load the complete snapshot. The initial list is still available.';}
    finally{loading=false;$('#snapshot-loading').hidden=true;}
  }
  document.documentElement.classList.add('enhanced');restore();load();
}
