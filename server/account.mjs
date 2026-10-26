import {HttpError,cookies,cookie,seal,unseal,randomToken,digest,returnPath,jsonBody,writeOrigin,githubPR} from './security.mjs';
import {readPR,verifyPR} from './github.mjs';

const SESSION='fp-session',LOGIN='fp-login',SESSION_DAYS=14;
export async function handleAccount(request,env,fetcher=fetch){
  const url=new URL(request.url),headers=new Headers({'Cache-Control':'private, no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
  const origin=env.APP_ORIGIN||url.origin,secure=url.protocol==='https:';
  const setCookie=(name,value,age)=>headers.append('Set-Cookie',cookie(name,value,age,secure));
  const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:new Headers([...headers,['Content-Type','application/json; charset=utf-8']])});
  const redirect=path=>new Response(null,{status:303,headers:new Headers([...headers,['Location',path]])});
  const sessionCookie=async data=>{const value=await seal(data,env.SESSION_KEY,SESSION);if(value.length>3900)throw new HttpError(503,'The login session could not be stored.');setCookie(SESSION,value,SESSION_DAYS*86400);};
  const sb=async(path,{method='GET',body,token,prefer,extraHeaders={}}={})=>{
    const result=await fetcher(env.SUPABASE_URL+path,{method,headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,...(token?{Authorization:`Bearer ${token}`} : {}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...(prefer?{Prefer:prefer}:{}),...extraHeaders},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
    let data=null;try{data=await result.json();}catch{}
    if(!result.ok){if(result.status===401)throw new HttpError(401,'Your session expired. Please sign in again.');if(data?.code==='23505')throw new HttpError(409,'This item is already saved.');if(data?.message?.includes('limit reached'))throw new HttpError(409,data.message);throw new HttpError(result.status===429?429:503,result.status===429?'Account requests are temporarily limited.':'Account services are temporarily unavailable. Please try again.');}return data;
  };
  const job=(action,fact)=>sb('/functions/v1/progress-internal',{method:'POST',extraHeaders:{'X-FirstPatch-Job-Key':env.JOB_KEY},body:{action,...(fact?{fact}:{})}});
  try{
    if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.SESSION_KEY)return reply({error:'Account services are not configured yet. You can still browse all public issues.'},503);
    if(url.pathname==='/auth/start'){
      if(request.method!=='GET')throw new HttpError(405,'Method not allowed.');
      const verifier=randomToken(),next=returnPath(url.searchParams.get('next'));
      const save=url.searchParams.get('save')?.slice(0,200)||null;
      setCookie(LOGIN,await seal({verifier,next,save,expires:Date.now()+600000},env.SESSION_KEY,LOGIN),600);
      const target=new URL('/auth/v1/authorize',env.SUPABASE_URL);target.searchParams.set('provider','github');target.searchParams.set('redirect_to',origin+'/auth/callback');target.searchParams.set('code_challenge',await digest(verifier));target.searchParams.set('code_challenge_method','s256');
      return redirect(target.href);
    }
    if(url.pathname==='/auth/callback'){
      const flow=await unseal(cookies(request)[LOGIN]||'',env.SESSION_KEY,LOGIN);setCookie(LOGIN,'',0);
      if(!flow||flow.expires<Date.now()||!url.searchParams.get('code'))return redirect('/saved/?auth=cancelled');
      const result=await sb('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:url.searchParams.get('code'),code_verifier:flow.verifier}});
      await sessionCookie({access:result.access_token,refresh:result.refresh_token,github:result.provider_token||null,expires:result.expires_at||Date.now()/1000+result.expires_in,until:Date.now()+SESSION_DAYS*86400000});
      headers.append('Set-Cookie',`fp-signed-in=1; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}${secure?'; Secure':''}`);
      return redirect('/auth/return/?next='+encodeURIComponent(flow.next)+(flow.save?'&save='+encodeURIComponent(flow.save):''));
    }
    if(url.pathname==='/api/jobs/progress'){
      if(request.method!=='POST')throw new HttpError(405,'Method not allowed.');
      const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');
      if(!env.JOB_KEY||!supplied||await digest(supplied)!==await digest(env.JOB_KEY))throw new HttpError(403,'Forbidden.');
      const due=await job('due');let checked=0,failed=0,limited=false;
      for(const row of due){try{const fact=await readPR(row.url,request.headers.get('x-github-token')||env.GITHUB_READ_TOKEN,fetcher);await job('record',fact);checked++;}catch(error){if(error.status===429){limited=true;break;}if(error.status===404){await job('record',{...row,state:'unavailable',title:'Pull request no longer publicly available'});checked++;}else failed++;}}
      return reply({checked,failed,limited,batchLimit:5});
    }
    if(!['GET','POST','PATCH','DELETE'].includes(request.method))throw new HttpError(405,'Method not allowed.');
    if(request.method!=='GET')writeOrigin(request,origin);
    let session=await unseal(cookies(request)[SESSION]||'',env.SESSION_KEY,SESSION);
    if(!session||session.until<Date.now()){if(url.pathname==='/api/session')return reply({user:null});throw new HttpError(401,'Sign in with GitHub to save issues and track progress.');}
    if(session.expires<Date.now()/1000+60){const fresh=await sb('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh}});session={...session,access:fresh.access_token,refresh:fresh.refresh_token,expires:fresh.expires_at||Date.now()/1000+fresh.expires_in};await sessionCookie(session);}
    const user=await sb('/auth/v1/user',{token:session.access});
    const identity=user.identities?.find(i=>i.provider==='github');
    if(!identity)throw new HttpError(401,'Sign in with a GitHub account.');
    const githubId=String(identity.provider_id||identity.identity_data?.provider_id||identity.identity_data?.sub||'');
    const display={id:user.id,username:identity.identity_data?.user_name||identity.identity_data?.preferred_username||'GitHub contributor'};
    const db=(path,opts={})=>sb('/rest/v1/'+path,{...opts,token:session.access});
    if(request.method!=='GET'&&!['/api/logout','/api/account'].includes(url.pathname)){
      const allowed=await db('rpc/fp_take_action',{method:'POST',body:{p_action:url.pathname==='/api/prs'?'pr_check':url.pathname==='/api/preferences'?'preferences':'saved_write'}});
      if(!allowed)throw new HttpError(429,'You’ve reached the hourly action limit. Your saved work is safe; please try later.');
    }
    const preferences=async()=>{let p=await db('fp_preferences?select=theme,presets,last_active_at&limit=1');if(!p.length){p=await db('fp_preferences',{method:'POST',body:{user_id:user.id},prefer:'return=representation,resolution=ignore-duplicates'});if(!p?.length)p=await db('fp_preferences?select=theme,presets,last_active_at&limit=1');}else if(Date.now()-new Date(p[0].last_active_at).valueOf()>86400000)await db('fp_preferences?user_id=eq.'+user.id,{method:'PATCH',body:{last_active_at:new Date().toISOString()}});return p[0];};
    if(url.pathname==='/api/session'&&request.method==='GET')return reply({user:display,preferences:await preferences()});
    if(url.pathname==='/api/logout'&&request.method==='POST'){await sb('/auth/v1/logout?scope=local',{method:'POST',token:session.access});setCookie(SESSION,'',0);headers.append('Set-Cookie','fp-signed-in=; Path=/; Max-Age=0; SameSite=Lax');return reply({ok:true});}
    if(url.pathname==='/api/saved'&&request.method==='GET'){
      const columns=url.searchParams.get('summary')==='1'?'id,issue_id':'*';
      const rows=await db('fp_saved?select='+columns+'&order=created_at.desc&limit=200');return reply({items:rows});
    }
    if(url.pathname==='/api/saved'&&request.method==='POST'){
      const body=await jsonBody(request);const snapshot=await env.ASSETS.fetch(new Request(origin+'/data/issues.json'));if(!snapshot.ok)throw new HttpError(503,'The public snapshot is temporarily unavailable.');const issue=(await snapshot.json()).items.find(i=>String(i.id)===String(body.issue_id));if(!issue)throw new HttpError(404,'This issue is no longer in the current snapshot. Open the original discussion to check it.');
      const row={issue_id:String(issue.id),issue_url:issue.url,repository:issue.repo,title:issue.title,language:issue.language||''};
      const result=await db('fp_saved?on_conflict=user_id,issue_id',{method:'POST',body:row,prefer:'resolution=ignore-duplicates,return=representation'});return reply({item:result?.[0]||null});
    }
    const savedMatch=url.pathname.match(/^\/api\/saved\/([a-f0-9-]{36})$/);
    if(savedMatch){const id=savedMatch[1];
      if(request.method==='DELETE'){await db('fp_saved?id=eq.'+id,{method:'DELETE'});return reply({ok:true});}
      if(request.method==='PATCH'){const body=await jsonBody(request);if(!['saved','in_progress','archived'].includes(body.status)||typeof body.note!=='string'||body.note.length>1000||typeof body.updated_at!=='string')throw new HttpError(400,'Choose a status and a note of at most 1,000 characters.');const rows=await db('fp_saved?id=eq.'+id+'&updated_at=eq.'+encodeURIComponent(body.updated_at),{method:'PATCH',body:{status:body.status,note:body.note},prefer:'return=representation'});if(!rows.length)throw new HttpError(409,'This item changed in another tab. Reload before saving your note.');return reply({item:rows[0]});}
    }
    if(url.pathname==='/api/prs'&&request.method==='GET'){return reply({items:await db('fp_linked_prs?select=id,saved_id,created_at,fp_pr_facts(*)&order=created_at.desc&limit=400')});}
    if(url.pathname==='/api/prs'&&request.method==='DELETE'){const body=await jsonBody(request);const canonical=githubPR(body.url).url;await db('fp_linked_prs?pr_url=eq.'+encodeURIComponent(canonical),{method:'DELETE'});return reply({ok:true});}
    if(url.pathname==='/api/prs'&&request.method==='POST'){
      const body=await jsonBody(request);if(typeof body.saved_id!=='string'||!/^[a-f0-9-]{36}$/.test(body.saved_id))throw new HttpError(400,'Choose one of your saved issues.');
      const [saved]=await db('fp_saved?id=eq.'+body.saved_id+'&select=id,repository&limit=1');if(!saved)throw new HttpError(404,'Saved issue not found.');
      const canonical=githubPR(body.url).url;
      const [cached]=await db('fp_linked_prs?pr_url=eq.'+encodeURIComponent(canonical)+'&select=fp_pr_facts(*)&limit=1');
      const fresh=cached?.fp_pr_facts&&Date.now()-new Date(cached.fp_pr_facts.checked_at).valueOf()<21600000;
      const fact=verifyPR(fresh?cached.fp_pr_facts:await readPR(canonical,session.github||env.GITHUB_READ_TOKEN,fetcher),githubId,saved);
      if(!fresh)await job('record',fact);
      const linked=await db('fp_linked_prs?on_conflict=user_id,saved_id,pr_url',{method:'POST',body:{saved_id:saved.id,pr_url:fact.url},prefer:'resolution=ignore-duplicates,return=representation'});return reply({item:linked?.[0]||null});
    }
    if(url.pathname==='/api/preferences'&&request.method==='PATCH'){
      const body=await jsonBody(request);if(!['system','light','dark'].includes(body.theme)||!Array.isArray(body.presets)||body.presets.length>20)throw new HttpError(400,'Invalid preferences.');
      const presets=body.presets.map(p=>{if(typeof p.name!=='string'||p.name.length>60||typeof p.url!=='string'||p.url.length>1800)throw new HttpError(400,'Invalid saved search.');return {name:p.name.trim(),url:returnPath(p.url)};});
      await db('fp_preferences?on_conflict=user_id',{method:'POST',body:{user_id:user.id,theme:body.theme,presets,last_active_at:new Date().toISOString()},prefer:'resolution=merge-duplicates'});return reply({ok:true});
    }
    if(url.pathname==='/api/export'&&request.method==='GET')return reply({exported_at:new Date().toISOString(),user:display,preferences:await preferences(),saved:await db('fp_saved?select=*&limit=200'),pull_requests:await db('fp_linked_prs?select=*,fp_pr_facts(*)&limit=400')});
    if(url.pathname==='/api/account'&&request.method==='DELETE'){const body=await jsonBody(request);if(body.confirm!=='DELETE')throw new HttpError(400,'Type DELETE to confirm account deletion.');await sb('/functions/v1/delete-account',{method:'POST',body:{confirm:'DELETE'},token:session.access});setCookie(SESSION,'',0);headers.append('Set-Cookie','fp-signed-in=; Path=/; Max-Age=0; SameSite=Lax');return reply({ok:true});}
    throw new HttpError(404,'Account endpoint not found.');
  }catch(error){if(error.status===401)setCookie(SESSION,'',0);return reply({error:error instanceof HttpError?error.message:'Account services are temporarily unavailable. Please try again.'},error.status||503);}
}
