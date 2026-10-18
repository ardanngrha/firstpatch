export const sourceDefinitions = [
  {id:'good-first-issue',name:'Good First Issue',url:'https://goodfirstissue.dev/',kind:'catalogue',method:'Public repository list',dataUrl:'https://github.com/DeepSourceCorp/good-first-issue/blob/master/data/repositories.toml',license:'MIT',note:'Complete public repository seed list. Issue status comes from GitHub.'},
  {id:'first-contributions',name:'First Contributions',url:'https://firstcontributions.github.io/',kind:'catalogue',method:'Public project catalogue',dataUrl:'https://github.com/firstcontributions/firstcontributions.github.io/blob/main/src/data/projects.js',license:'MIT',note:'Complete published project list, including projects hosted outside GitHub.'},
  {id:'up-for-grabs',name:'Up For Grabs',url:'https://up-for-grabs.net/',kind:'catalogue',method:'Published JSON catalogue',dataUrl:'https://up-for-grabs.net/javascripts/projects.json',license:'CC BY-SA 4.0',note:'Complete published JSON catalogue. Project labels and descriptions retain source attribution.'},
  {id:'codetriage',name:'CodeTriage',url:'https://www.codetriage.com/',kind:'catalogue',method:'Bounded public directory snapshot',dataUrl:'https://www.codetriage.com/',license:'Public repository references',note:'A bounded snapshot of the public directory, not the full CodeTriage database. CodeTriage lists general open issues, so we check beginner labels separately.'},
  {id:'goodfirstissue-org',name:'GoodFirstIssue.org',url:'https://www.goodfirstissue.org/',kind:'catalogue',method:'Bounded public discovery snapshot',dataUrl:'https://www.goodfirstissue.org/repos/beginner-friendly',license:'Public repository references',note:'Repository references from one public beginner-friendly directory page. No AI-generated summaries, profiles or paid data are copied.'},
  {id:'firstissue-dev',name:'FirstIssue.dev',url:'https://www.firstissue.dev/',kind:'resource',method:'External discovery resource',dataUrl:'https://www.firstissue.dev/good-first-issues',license:'External link only',note:'Its personalized issue feed requires an account. FirstPatch links to the public resource; it does not claim to import that private feed or call its blocked API.'},
  {id:'first-timers-only',name:'First Timers Only',url:'https://www.firsttimersonly.com/',kind:'guide',method:'Contribution guide and label discovery',dataUrl:'https://www.firsttimersonly.com/',license:'External link only',note:'A guide, not a project database. GitHub issues carrying the first-timers-only label are discovered separately and identified by that label.'},
  {id:'github',name:'GitHub',url:'https://github.com/',kind:'issues',method:'Official GitHub API',dataUrl:'https://docs.github.com/en/graphql',license:'Public GitHub metadata',note:'Authoritative issue status, assignees, labels and repository metadata. Discovery is bounded, not an exhaustive mirror of GitHub.'}
];
export const escapeHtml = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value) { try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';} catch {return '';} }
export function repositoryFromUrl(value) {try {const u=new URL(value);if(u.hostname!=='github.com')return null;const [owner,repo]=u.pathname.split('/').filter(Boolean);if(!owner||!repo||['issues','search','orgs','topics','users','collections'].includes(owner))return null;return `${owner}/${repo.replace(/\.git$/,'')}`;}catch{return null;} }
export function textExcerpt(value,max=220) {
  return String(value||'').replace(/<!--[\s\S]*?-->/g,' ').replace(/```[\s\S]*?```/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,'').replace(/[#*_`>|]/g,'').replace(/\s+/g,' ').trim().slice(0,max).replace(/\s+\S*$/,'');
}
export function issueType(labels) {const s=labels.join(' ').toLowerCase();return /doc|translation|locali[sz]|i18n/.test(s)?'Documentation':/test/.test(s)?'Testing':/bug|fix/.test(s)?'Bug fix':/enhance|feature/.test(s)?'Enhancement':'Other';}
export function mergeProject(map,entry) {
  const repo=entry.repo||repositoryFromUrl(entry.url||'');const url=repo?`https://github.com/${repo}`:safeUrl(entry.url);if(!url)return;
  const key=(repo||url).toLowerCase();const old=map.get(key)||{repo,name:entry.name||repo,url,description:'',tags:[],sources:[],labels:[],issueUrl:null};
  if(!old.description&&entry.description)old.description=entry.description;
  old.tags=[...new Set([...old.tags,...(entry.tags||[])])];old.sources=[...new Set([...old.sources,...(entry.sources||[])])];old.labels=[...new Set([...old.labels,...(entry.labels||[])])];
  if(entry.issueUrl)old.issueUrl=safeUrl(entry.issueUrl);map.set(key,old);return old;
}
export const languageSlug = l => l.toLowerCase().replace(/\+/g,'plus').replace(/#/g,'sharp').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function directoryRepoRefs(html) {
  const reserved=new Set(['assets','auth','repos','issues','languages','labels','users','topics','orgs','zh','zh-TW','ja','de-DE','fr-FR','es','it','pt-BR','vi']);
  return [...new Set([...html.matchAll(/href="\/([\w.-]+\/[\w.-]+)"/g)].map(m=>m[1]).filter(repo=>!reserved.has(repo.split('/')[0])))];
}
