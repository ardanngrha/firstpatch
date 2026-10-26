create table firstpatch_private.rate_windows(
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  bucket timestamptz not null,
  count integer not null,
  primary key(user_id,action)
);
create function public.fp_take_action(p_action text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); amount integer; max_count integer; current_bucket timestamptz:=date_trunc('hour',now());
begin
  if uid is null or p_action not in ('saved_write','pr_check','preferences') then return false; end if;
  max_count:=case when p_action='pr_check' then 10 when p_action='preferences' then 40 else 120 end;
  insert into firstpatch_private.rate_windows(user_id,action,bucket,count) values(uid,p_action,current_bucket,1)
  on conflict(user_id,action) do update set count=case when firstpatch_private.rate_windows.bucket=excluded.bucket then least(firstpatch_private.rate_windows.count+1,max_count+1) else 1 end,bucket=excluded.bucket
  returning count into amount;
  return amount<=max_count;
end $$;
revoke all on function public.fp_take_action(text) from public,anon;
grant execute on function public.fp_take_action(text) to authenticated;

create or replace function firstpatch_private.validate_link() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  if (select count(*) from public.fp_linked_prs where user_id=new.user_id)>=400
    and not exists(select 1 from public.fp_linked_prs where user_id=new.user_id and saved_id=new.saved_id and pr_url=new.pr_url) then
    raise exception 'Tracked PR limit reached (400)';
  end if;
  if not exists(select 1 from public.fp_pr_facts f
    join public.fp_saved s on s.id=new.saved_id and s.user_id=new.user_id
    join auth.identities i on i.user_id=new.user_id and i.provider='github' and i.provider_id=f.author_id
    where f.url=new.pr_url and lower(f.repository)=lower(s.repository)) then
    raise exception 'The PR author and target repository must match your saved issue' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function public.fp_due_prs(text) from authenticated;
