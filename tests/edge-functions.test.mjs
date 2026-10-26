import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
async function handlerFor(name,fetcher){
  let handler;
  const source=await readFile(new URL('../supabase/functions/'+name+'/index.js',import.meta.url),'utf8');
  runInNewContext(source,{Deno:{serve:callback=>{handler=callback;},env:{get:key=>({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'fixture-anon',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'})[key]}},Response,Request,AbortSignal,crypto,TextEncoder,fetch:fetcher});
  return handler;
}
test('account deletion requires explicit confirmation and a verified Auth identity',async()=>{
  let calls=0;
  const handler=await handlerFor('delete-account',async()=>{calls++;return Response.json({error:'Invalid token'},{status:401});});
  assert.equal((await handler(new Request('https://example.test',{method:'POST',body:'{}'}))).status,401);
  assert.equal((await handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({confirm:'NO'})}))).status,400);
  assert.equal(calls,0);
  assert.equal((await handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer forged'},body:JSON.stringify({confirm:'DELETE'})}))).status,401);
  assert.equal(calls,1);
});
test('account deletion targets only the identity returned by Auth, ignoring supplied user IDs',async()=>{
  const owner='f1e57a00-0000-4000-8000-000000000001';
  const handler=await handlerFor('delete-account',async(url,options)=>{
    if(url.endsWith('/auth/v1/user')){assert.equal(options.headers.authorization,'Bearer fixture-user');return Response.json({id:owner});}
    assert.equal(url,'https://example.supabase.co/auth/v1/admin/users/'+owner);
    assert.equal(options.method,'DELETE');assert.equal(options.headers.Authorization,'Bearer fixture-service');
    return Response.json({});
  });
  const response=await handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer fixture-user'},body:JSON.stringify({confirm:'DELETE',user_id:'someone-else'})}));
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
});
test('internal progress function rejects unauthenticated requests before accessing privileged storage',async()=>{
  const handler=await handlerFor('progress-internal',()=>assert.fail('No privileged upstream call'));
  const response=await handler(new Request('https://example.test',{method:'POST',body:JSON.stringify({action:'due'})}));
  assert.equal(response.status,403);
});
