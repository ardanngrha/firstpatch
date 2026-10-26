Deno.serve(async request => {
  const headers = {'Content-Type': 'application/json', 'Cache-Control': 'private, no-store'};
  const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});
  if (request.method !== 'POST') return reply(405, {error: 'Method not allowed.'});
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return reply(401, {error: 'Sign in required.'});
  let body;
  try { body = await request.json(); } catch { return reply(400, {error: 'Invalid request.'}); }
  if (body.confirm !== 'DELETE') return reply(400, {error: 'Explicit confirmation is required.'});
  const origin = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  // Verify with Auth; never accept a user ID or an unverified JWT claim from the caller.
  const identity = await fetch(origin + '/auth/v1/user', {headers: {apikey: publicKey, authorization}, signal: AbortSignal.timeout(10000)});
  if (!identity.ok) return reply(401, {error: 'Your session expired.'});
  const user = await identity.json();
  if (typeof user.id !== 'string' || !/^[a-f0-9-]{36}$/.test(user.id)) return reply(401, {error: 'Invalid identity.'});
  const deleted = await fetch(origin + '/auth/v1/admin/users/' + user.id, {method: 'DELETE', headers: {apikey: serviceKey, Authorization: 'Bearer ' + serviceKey}, signal: AbortSignal.timeout(10000)});
  if (!deleted.ok) return reply(503, {error: 'Account deletion could not be completed. Please try again.'});
  return reply(200, {ok: true});
});
