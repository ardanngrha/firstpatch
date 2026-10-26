-- Transaction-only fixtures: no passwords, no emails, and no persistent users.
begin;
insert into auth.users(id) values
('f1e57a00-0000-4000-8000-000000000001'),('f1e57a00-0000-4000-8000-000000000002');
insert into auth.identities(user_id,provider_id,provider,identity_data) values
('f1e57a00-0000-4000-8000-000000000001','fp-test-1','github','{"sub":"fp-test-1"}'),
('f1e57a00-0000-4000-8000-000000000002','fp-test-2','github','{"sub":"fp-test-2"}');
insert into public.fp_saved(id,user_id,issue_id,issue_url,repository,title,note) values
('f1e57a00-0000-4000-8000-000000000011','f1e57a00-0000-4000-8000-000000000001','fp-rls-1','https://github.com/firstpatch-test/repo/issues/1','firstpatch-test/repo','RLS fixture one','Owner one note'),
('f1e57a00-0000-4000-8000-000000000012','f1e57a00-0000-4000-8000-000000000002','fp-rls-2','https://github.com/firstpatch-test/repo/issues/2','firstpatch-test/repo','RLS fixture two','Owner two note');
insert into public.fp_pr_facts(url,repository,author_id,title,state,opened_at) values
('https://github.com/firstpatch-test/repo/pull/1','firstpatch-test/repo','fp-test-1','Own PR','open',now()),
('https://github.com/firstpatch-test/repo/pull/2','firstpatch-test/repo','fp-test-2','Other PR','open',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','f1e57a00-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"f1e57a00-0000-4000-8000-000000000001","app_metadata":{"provider":"github"}}',true);
do $$
declare changed integer; allowed boolean;
begin
  if (select count(*) from public.fp_saved)<>1 then raise exception 'RLS read leaked another owner'; end if;
  if (select note from public.fp_saved)<>'Owner one note' then raise exception 'Wrong private note visible'; end if;
  update public.fp_saved set note='Not permitted' where issue_id='fp-rls-2';
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'RLS update crossed owner boundary'; end if;
  begin
    update public.fp_saved set user_id='f1e57a00-0000-4000-8000-000000000002' where issue_id='fp-rls-1';
    raise exception 'Owner reassignment unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.fp_saved set note=repeat('x',1001) where issue_id='fp-rls-1';
    raise exception 'Oversized note unexpectedly accepted';
  exception when check_violation then null; end;
  if (select count(*) from public.fp_pr_facts)<>0 then raise exception 'Unlinked PR facts leaked'; end if;
  insert into public.fp_linked_prs(saved_id,pr_url) values('f1e57a00-0000-4000-8000-000000000011','https://github.com/firstpatch-test/repo/pull/1');
  if (select count(*) from public.fp_pr_facts)<>1 then raise exception 'Own linked PR is not readable'; end if;
  begin
    insert into public.fp_linked_prs(saved_id,pr_url) values('f1e57a00-0000-4000-8000-000000000011','https://github.com/firstpatch-test/repo/pull/2');
    raise exception 'Another author PR unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.fp_pr_facts set state='merged';
    raise exception 'User could forge verified facts';
  exception when insufficient_privilege then null; end;
  begin
    perform job_hash from firstpatch_private.settings;
    raise exception 'Job settings are visible to a user';
  exception when insufficient_privilege then null; end;
  for i in 1..10 loop
    allowed:=public.fp_take_action('pr_check');
    if not allowed then raise exception 'Rate limit rejected permitted action'; end if;
  end loop;
  if public.fp_take_action('pr_check') then raise exception 'Rate limit did not reject excess work'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.fp_saved;
    raise exception 'Anonymous user could read saved data';
  exception when insufficient_privilege then null; end;
  begin
    perform public.fp_due_prs('invalid');
    raise exception 'Invalid job credential unexpectedly accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'passed: owner isolation, private notes, owner immutability, note limits, verified PR authorship, fact write protection, job isolation, action budget, anonymous access; fixtures rolled back' as result;
