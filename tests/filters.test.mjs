import test from 'node:test';
import assert from 'node:assert/strict';
import {filterIssues,filterProjects,sortIssues,issueMarkup,projectMarkup,count} from '../public/assets/issues.mjs';
import {applyDataPolicy} from '../scripts/data-policy.mjs';
const asOf='2026-10-18T00:00:00Z';
const issue={id:'a',number:1,title:'Fix layout',url:'https://github.com/example/app/issues/1',repo:'example/app',repoUrl:'https://github.com/example/app',language:'Dart',type:'Bug fix',labels:['good first issue'],sources:['up-for-grabs','github'],stars:100,forks:10,comments:0,assignees:0,license:'MIT',hasContributing:true,repoPushedAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z',createdAt:'2026-10-01T00:00:00Z',checkedAt:asOf};

test('combined filters are ANDed, include exact thresholds and preserve zero comments',()=>{
  const items=[issue,{...issue,id:'b',assignees:1},{...issue,id:'c',stars:99},{...issue,id:'d',comments:1}];
  const filters={language:'Dart',unassigned:'on',minStars:'100',maxStars:'100',minForks:'10',maxForks:'10',maxComments:'0',license:'MIT',label:'good first issue',hasGuide:'on',pushDays:'7',issueDays:'7'};
  assert.deepEqual(filterIssues(items,filters,asOf).map(i=>i.id),['a']);
  assert.equal(filterIssues(items,{minStars:'1000',maxStars:'100'},asOf).length,0);
});
test('unknown values are never treated as zero or a licence clearance',()=>{
  const missing={...issue,id:'unknown',stars:null,forks:null,comments:null,license:'NOASSERTION',hasContributing:undefined,repoPushedAt:null};
  for(const filters of [{maxStars:'100'},{minForks:'0'},{maxForks:'100'},{maxComments:'0'},{license:'identified'},{hasGuide:'on'},{pushDays:'365'}])assert.equal(filterIssues([missing],filters,asOf).length,0);
  assert.equal(filterIssues([missing],{license:'unknown'},asOf).length,1);
  assert.equal(count(null),'Not checked');assert.equal(count(0),'0');
});
test('activity uses the supplied snapshot, not the host clock; missing and future dates fail',()=>{
  const items=[issue,{...issue,id:'old',repoPushedAt:'2026-10-10T23:59:59Z'},{...issue,id:'future',repoPushedAt:'2026-10-19T00:00:00Z'}];
  assert.deepEqual(filterIssues(items,{pushDays:'7'},asOf).map(i=>i.id),['a']);
  assert.equal(filterIssues(items,{pushDays:'7'},'invalid').length,0);
});
test('sorts keep zero values, place unknowns last, and do not mutate the source',()=>{
  const items=[{...issue,id:'unknown',stars:null,forks:null,comments:null},{...issue,id:'big',stars:1000,forks:500,comments:10},issue];
  assert.deepEqual(sortIssues(items,'stars').map(i=>i.id),['big','a','unknown']);
  assert.deepEqual(sortIssues(items,'forks').map(i=>i.id),['big','a','unknown']);
  assert.deepEqual(sortIssues(items,'comments').map(i=>i.id),['a','big','unknown']);
  assert.equal(items[0].id,'unknown');
});
test('shared row keeps disclosures closed, escapes input and never renders copied issue bodies',()=>{
  const html=issueMarkup({...issue,title:'<img src=x onerror=alert(1)>',excerpt:'PRIVATE_BODY_SENTINEL',repoDescription:'<script>bad</script>',licenseUrl:'javascript:alert(1)'});
  assert(!/<details[^>]*\sopen/.test(html));assert(!html.includes('PRIVATE_BODY_SENTINEL'));
  assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));
  assert(html.includes('100 stars'));assert(html.includes('10 forks'));assert(html.includes('0 comments'));
  assert(!html.split('</summary>')[0].includes('github-logo.svg'));
});
test('fallback policy drops retired source-only projects, bodies and stale discovery credit',()=>{
  const projects=[{repo:'example/app',description:'Licensed description',sources:['up-for-grabs','codetriage']},{repo:'retired/only',description:'Retired',sources:['codetriage']}];
  const result=applyDataPolicy({projects,issues:[{...issue,excerpt:'COPY',repoDescription:'OLD'},{...issue,id:'b',repo:'retired/only'},{...issue,id:'c',repo:'separate/guide',labels:['first-timers-only'],sources:['github']}],sources:[{id:'codetriage',status:'ok',count:100}]});
  assert.equal(result.projects.length,1);assert.deepEqual(result.projects[0].sources,['up-for-grabs']);
  assert.deepEqual(result.issues.map(i=>i.id),['a','c']);assert(!('excerpt' in result.issues[0]));
  assert.equal(result.issues[0].repoDescription,'Licensed description');
  assert(!result.issues[0].sources.includes('codetriage'));assert.equal(result.sources[0].status,'linked');
  assert.deepEqual(applyDataPolicy(result),result);
});
test('project ranges, language, license, source and activity use AND semantics',()=>{
  const project={...issue,name:'App',description:'A small tool',tags:['flutter'],openIssues:0,metadataCheckedAt:asOf};
  const items=[project,{...project,repo:'example/other',forks:11},{...project,repo:'external/project',stars:null,forks:null,license:null}];
  assert.deepEqual(filterProjects(items,{q:'flutter',language:'Dart',source:'up-for-grabs',minStars:'100',maxStars:'100',minForks:'10',maxForks:'10',license:'MIT',hasGuide:'on',pushDays:'7'},asOf).map(p=>p.repo),['example/app']);
  assert.equal(filterProjects([{...project,forks:0}],{maxForks:'0'},asOf).length,1);
  assert.equal(filterProjects([{...project,forks:null}],{maxForks:'0'},asOf).length,0);
  assert.equal(filterProjects(items,{minStars:'1000',maxStars:'100'},asOf).length,0);
  assert.deepEqual(sortIssues([{repo:'z/z'},{repo:'a/a'}],'name').map(p=>p.repo),['a/a','z/z']);
});
test('project rows distinguish zero from unavailable facts, escape HTML and reject unsafe URLs',()=>{
  const html=projectMarkup({...issue,name:'<script>bad</script>',description:'<script>bad</script>',tags:[],openIssues:0,metadataCheckedAt:asOf,url:'https://github.com/example/app',licenseUrl:'javascript:alert(1)'});
  assert(html.includes('0 open issues'));assert(html.includes('100 stars'));assert(html.includes('10 forks'));
  assert(html.includes('Metadata checked'));assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));
  const unavailable=projectMarkup({name:'External',url:'https://example.com',sources:[],tags:[]});
  assert(unavailable.includes('Issue count not checked'));assert(unavailable.includes('External host; GitHub metadata unavailable'));
  assert(!unavailable.includes('0 open issues'));
});
