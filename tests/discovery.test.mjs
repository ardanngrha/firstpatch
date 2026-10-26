import test from 'node:test';
import assert from 'node:assert/strict';
import {filterIssues,filterProjects,sortIssues,diversifyIssues} from '../public/assets/issues.mjs';
const issue=(id,repo,tags=[])=>({id,repo,title:'Fix a label',language:'Dart',labels:[],sources:[],tags,stars:10,updatedAt:'2026-10-26T00:00:00Z'});
test('framework filter uses explicit catalogue tags and never infers Flutter from Dart',()=>{
  const data=[issue('1','a/flutter-tool',['flutter']),issue('2','b/dart-tool',[])];
  assert.deepEqual(filterIssues(data,{tag:'Flutter'}).map(i=>i.id),['1']);
  assert.equal(filterIssues(data,{language:'Dart'}).length,2);
  assert.equal(filterProjects([{repo:'b/dart-tool',language:'Dart',sources:[],tags:[]}],{tag:'flutter'}).length,0);
});
test('one issue per project preserves selected sort order and ignores repository casing',()=>{
  const data=[{...issue('a','owner/repo'),stars:2},{...issue('b','OWNER/REPO'),stars:20},{...issue('c','other/repo'),stars:10}];
  assert.deepEqual(diversifyIssues(sortIssues(data,'stars')).map(i=>i.id),['b','c']);
  assert.equal(data.length,3);
});
