Deno.serve(async request => {
  const headers = {'Content-Type': 'application/json', 'Cache-Control': 'private, no-store'};
  const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});
  if (request.method !== 'POST') return reply(405, {error: 'Method not allowed.'});
  const key = request.headers.get('x-firstpatch-job-key') || '';
  const keyHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))), b => b.toString(16).padStart(2, '0')).join('');
  if (key.length !== 64 || keyHash !== '3ed03de30b207969dba686bfc900e141f10fc2e18264d972b893b0b73e8bd9a2') return reply(403, {error: 'Forbidden.'});
  let body;
  try { body = await request.json(); } catch { return reply(400, {error: 'Invalid request.'}); }
  const rpc = body.action === 'due' ? 'fp_due_prs_batch' : body.action === 'record' ? 'fp_record_pr' : null;
  if (!rpc) return reply(400, {error: 'Unknown operation.'});
  const origin = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(origin + '/rest/v1/rpc/' + rpc, {method: 'POST', headers: {apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json'}, body: JSON.stringify({p_key: key, ...(body.action === 'record' ? {p_fact: body.fact} : {})}), signal: AbortSignal.timeout(10000)});
  if (!response.ok) return reply(503, {error: 'Progress storage could not be reached.'});
  const text = await response.text();
  return reply(200, text ? JSON.parse(text) : {ok: true});
});
