import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAccount} from '../server/account.mjs';
import {seal,unseal,randomToken,returnPath,githubPR} from '../server/security.mjs';
import {verifyPR,readPR} from '../server/github.mjs';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SESSION_KEY:randomToken(),APP_ORIGIN:'https://firstpatch.pages.dev',JOB_KEY:'a'.repeat(64)};
test('session encryption binds cookie purpose and rejects tampering or a different key',async()=>{
  const value=await seal({access:'private-access',refresh:'private-refresh'},env.SESSION_KEY,'session');
  assert.ok(!value.includes('private'));
  assert.deepEqual(await unseal(value,env.SESSION_KEY,'session'),{access:'private-access',refresh:'private-refresh'});
  assert.equal(await unseal(value,env.SESSION_KEY,'login'),null);
  assert.equal(await unseal(value,randomToken(),'session'),null);
  assert.equal(await unseal(value.slice(0,20)+'X'+value.slice(21),env.SESSION_KEY,'session'),null);
});
test('OAuth return paths cannot redirect to another origin or back into API/auth routes',()=>{
  for(const value of ['//evil.example','https://evil.example','/\\evil.example','/auth/start','/api/export','/\nLocation: x'])assert.equal(returnPath(value),'/');
  assert.equal(returnPath('/?language=Dart&unassigned=on'),'/?language=Dart&unassigned=on');
});
test('login generates separate PKCE flows and an HttpOnly short-lived verifier cookie',async()=>{
  const a=await handleAccount(new Request(env.APP_ORIGIN+'/auth/start?next=%2F%3Flanguage%3DDart&save=I_123'),env);
  const b=await handleAccount(new Request(env.APP_ORIGIN+'/auth/start'),env);
  assert.equal(a.status,303);const target=new URL(a.headers.get('location'));
  assert.equal(target.origin,env.SUPABASE_URL);assert.equal(target.searchParams.get('code_challenge_method'),'s256');
  assert.notEqual(target.searchParams.get('code_challenge'),new URL(b.headers.get('location')).searchParams.get('code_challenge'));
  assert.match(a.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Max-Age=600; Secure/);
  assert.ok(!a.headers.get('location').includes('I_123'));
});
test('a missing or expired OAuth cookie cannot exchange a code',async()=>{
  const response=await handleAccount(new Request(env.APP_ORIGIN+'/auth/callback?code=stolen'),env,()=>assert.fail('No upstream exchange should occur'));
  assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/saved/?auth=cancelled');
});
test('unauthenticated account reads reveal no user data and are never cacheable',async()=>{
  const session=await handleAccount(new Request(env.APP_ORIGIN+'/api/session'),env,()=>assert.fail('No upstream call'));
  assert.deepEqual(await session.json(),{user:null});assert.match(session.headers.get('cache-control'),/private, no-store/);
  const saved=await handleAccount(new Request(env.APP_ORIGIN+'/api/saved'),env,()=>assert.fail('No upstream call'));
  assert.equal(saved.status,401);
});
test('cross-origin or non-browser writes are rejected before upstream calls',async()=>{
  for(const origin of ['https://evil.example',null]){
    const response=await handleAccount(new Request(env.APP_ORIGIN+'/api/saved',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:'{}'}),env,()=>assert.fail('No upstream call'));
    assert.equal(response.status,403);
  }
});
test('scheduled job endpoint rejects missing or incorrect credentials',async()=>{
  for(const key of ['', 'wrong']){
    const r=await handleAccount(new Request(env.APP_ORIGIN+'/api/jobs/progress',{method:'POST',headers:{Authorization:'Bearer '+key}}),env,()=>assert.fail('No upstream call'));
    assert.equal(r.status,403);
  }
});
test('PR verification rejects foreign authors and wrong target repositories',()=>{
  const fact={author_id:'42',repository:'owner/project'};
  assert.throws(()=>verifyPR(fact,'43',{repository:'owner/project'}),/authored/);
  assert.throws(()=>verifyPR(fact,'42',{repository:'other/project'}),/repository/);
  assert.equal(verifyPR(fact,'42',{repository:'OWNER/PROJECT'}),fact);
  for(const url of ['https://evil.example/o/r/pull/1','https://github.com/o/r/issues/1','https://u:p@github.com/o/r/pull/1'])assert.throws(()=>githubPR(url));
});
test('closed PRs are not counted as merged; private PRs cannot enter tracking',async()=>{
  const response=privateRepo=>async()=>Response.json({html_url:'https://github.com/o/r/pull/1',base:{repo:{private:privateRepo,full_name:'o/r'}},user:{id:42},title:'A small fix',state:'closed',merged_at:null,created_at:'2026-10-01T00:00:00Z'});
  assert.equal((await readPR('https://github.com/o/r/pull/1',null,response(false))).state,'closed');
  await assert.rejects(()=>readPR('https://github.com/o/r/pull/1',null,response(true)),/public/);
});
test('callback returns only encrypted HttpOnly session data, never access tokens in URLs or JSON',async()=>{
  const login=await seal({verifier:'fixture-verifier',next:'/?language=Dart',save:'I_123',expires:Date.now()+60000},env.SESSION_KEY,'fp-login');
  const response=await handleAccount(new Request(env.APP_ORIGIN+'/auth/callback?code=fixture-code',{headers:{Cookie:'fp-login='+login}}),env,async(url,options)=>{
    assert.match(url,/grant_type=pkce/);assert.equal(JSON.parse(options.body).code_verifier,'fixture-verifier');
    return Response.json({access_token:'fixture-private-access',refresh_token:'fixture-private-refresh',provider_token:'fixture-private-github-token',expires_in:3600});
  });
  assert.equal(response.status,303);assert.ok(!response.headers.get('location').includes('private'));
  const cookies=response.headers.getSetCookie();assert.ok(cookies.some(c=>c.startsWith('fp-session=')&&c.includes('HttpOnly')));
  assert.ok(cookies.some(c=>c.startsWith('fp-signed-in=1')));
  assert.ok(!cookies.join('').includes('fixture-private-access'));
  assert.ok(!cookies.join('').includes('fixture-private-github-token'));
});
test('concurrent requests keep each user token and private response separate',async()=>{
  const run=async owner=>{
    const encrypted=await seal({access:'access-'+owner,refresh:'refresh-'+owner,expires:Date.now()/1000+3600,until:Date.now()+86400000},env.SESSION_KEY,'fp-session');
    const response=await handleAccount(new Request(env.APP_ORIGIN+'/api/saved',{headers:{Cookie:'fp-session='+encrypted}}),env,async(url,options)=>{
      assert.equal(options.headers.Authorization,'Bearer access-'+owner);
      if(url.endsWith('/auth/v1/user'))return Response.json({id:owner,identities:[{provider:'github',provider_id:owner,identity_data:{user_name:owner}}]});
      return Response.json([{id:owner,note:'private note '+owner}]);
    });
    return response.json();
  };
  const [a,b]=await Promise.all([run('A'),run('B')]);
  assert.deepEqual(a.items,[{id:'A',note:'private note A'}]);assert.deepEqual(b.items,[{id:'B',note:'private note B'}]);
});
test('public-page save indicators request identifiers without private notes',async()=>{
  const encrypted=await seal({access:'fixture-access',refresh:'fixture-refresh',expires:Date.now()/1000+3600,until:Date.now()+86400000},env.SESSION_KEY,'fp-session');
  const response=await handleAccount(new Request(env.APP_ORIGIN+'/api/saved?summary=1',{headers:{Cookie:'fp-session='+encrypted}}),env,async url=>{
    if(url.endsWith('/auth/v1/user'))return Response.json({id:'fixture-owner',identities:[{provider:'github',provider_id:'42'}]});
    assert.match(url,/select=id,issue_id&/);assert.ok(!url.includes('select=*'));
    return Response.json([{id:'fixture-save',issue_id:'fixture-issue'}]);
  });
  assert.deepEqual(await response.json(),{items:[{id:'fixture-save',issue_id:'fixture-issue'}]});
});
test('an expired GitHub provider token falls back only to public metadata',async()=>{
  let attempts=0;
  const fact=await readPR('https://github.com/o/r/pull/1','expired-provider',async(url,options)=>{
    attempts++;
    if(attempts===1){assert.equal(options.headers.Authorization,'Bearer expired-provider');return Response.json({},{status:401});}
    assert.equal(options.headers.Authorization,undefined);
    return Response.json({html_url:'https://github.com/o/r/pull/1',base:{repo:{private:false,full_name:'o/r'}},user:{id:42},title:'A public fix',state:'open',created_at:'2026-10-01T00:00:00Z'});
  });
  assert.equal(attempts,2);assert.equal(fact.state,'open');
});
