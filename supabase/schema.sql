create schema if not exists firstpatch_private;
revoke all on schema firstpatch_private from public, anon, authenticated;
create table firstpatch_private.settings (id boolean primary key default true check(id), job_hash text not null);

create table public.fp_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  theme text not null default 'system' check(theme in ('system','light','dark')),
  presets jsonb not null default '[]' check(jsonb_typeof(presets) = 'array' and jsonb_array_length(presets) <= 20 and octet_length(presets::text) <= 30000),
  last_active_at timestamptz not null default now()
);
create table public.fp_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  issue_id text not null check(length(issue_id) between 1 and 200),
  issue_url text not null check(issue_url ~ '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/issues/[0-9]+$'),
  repository text not null check(length(repository) between 3 and 201),
  title text not null check(length(title) between 1 and 1000),
  language text not null default '' check(length(language) <= 100),
  status text not null default 'saved' check(status in ('saved','in_progress','archived')),
  note text not null default '' check(length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, issue_id), unique(id,user_id)
);
create index fp_saved_owner_date on public.fp_saved(user_id,created_at desc);
create table public.fp_pr_facts (
  url text primary key check(url ~ '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/pull/[0-9]+$'),
  repository text not null,
  author_id text not null,
  title text not null,
  state text not null check(state in ('open','merged','closed','unavailable')),
  opened_at timestamptz not null,
  merged_at timestamptz,
  checked_at timestamptz not null default now()
);
create table public.fp_linked_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  saved_id uuid not null,
  pr_url text not null references public.fp_pr_facts(url),
  created_at timestamptz not null default now(),
  foreign key(saved_id,user_id) references public.fp_saved(id,user_id) on delete cascade,
  unique(user_id,saved_id,pr_url)
);
create index fp_linked_owner on public.fp_linked_prs(user_id,created_at desc);
create index fp_linked_url on public.fp_linked_prs(pr_url);

create function firstpatch_private.validate_link() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not exists(
    select 1 from public.fp_pr_facts f
    join public.fp_saved s on s.id=new.saved_id and s.user_id=new.user_id
    join auth.identities i on i.user_id=new.user_id and i.provider='github' and i.provider_id=f.author_id
    where f.url=new.pr_url and lower(f.repository)=lower(s.repository)
  ) then raise exception 'The PR author and target repository must match your saved issue' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function firstpatch_private.validate_link() from public,anon,authenticated;
create trigger fp_validate_link before insert or update on public.fp_linked_prs for each row execute function firstpatch_private.validate_link();

alter table public.fp_preferences enable row level security;
alter table public.fp_saved enable row level security;
alter table public.fp_linked_prs enable row level security;
alter table public.fp_pr_facts enable row level security;
revoke all on public.fp_preferences,public.fp_saved,public.fp_linked_prs,public.fp_pr_facts from anon,authenticated;
grant select,insert,update,delete on public.fp_preferences,public.fp_saved,public.fp_linked_prs to authenticated;
grant select on public.fp_pr_facts to authenticated;
create policy own_preferences on public.fp_preferences to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_saved on public.fp_saved to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_links on public.fp_linked_prs to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_pr_facts on public.fp_pr_facts for select to authenticated using(exists(select 1 from public.fp_linked_prs l where l.pr_url=url and l.user_id=(select auth.uid())));

create function firstpatch_private.limit_saved() returns trigger language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  if (select count(*) from public.fp_saved where user_id=new.user_id)>=200
     and not exists(select 1 from public.fp_saved where user_id=new.user_id and issue_id=new.issue_id) then
    raise exception 'Saved issue limit reached (200)';
  end if;
  return new;
end $$;
create trigger fp_saved_limit before insert on public.fp_saved for each row execute function firstpatch_private.limit_saved();
create function firstpatch_private.touch_saved() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
create trigger fp_saved_touch before update on public.fp_saved for each row execute function firstpatch_private.touch_saved();

create function firstpatch_private.job_ok(k text) returns boolean language sql security definer set search_path='' as $$
  select exists(select 1 from firstpatch_private.settings where job_hash=encode(extensions.digest(k,'sha256'),'hex'));
$$;
revoke all on function firstpatch_private.job_ok(text) from public,anon,authenticated;

create function public.fp_record_pr(p_key text,p_fact jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not firstpatch_private.job_ok(p_key) then raise exception 'Forbidden' using errcode='42501'; end if;
  insert into public.fp_pr_facts(url,repository,author_id,title,state,opened_at,merged_at,checked_at)
  values(p_fact->>'url',p_fact->>'repository',p_fact->>'author_id',left(p_fact->>'title',1000),p_fact->>'state',(p_fact->>'opened_at')::timestamptz,(p_fact->>'merged_at')::timestamptz,now())
  on conflict(url) do update set repository=excluded.repository,author_id=excluded.author_id,title=excluded.title,state=excluded.state,merged_at=excluded.merged_at,checked_at=now();
end $$;
revoke all on function public.fp_record_pr(text,jsonb) from public;
grant execute on function public.fp_record_pr(text,jsonb) to anon,authenticated;

create function public.fp_due_prs(p_key text) returns table(url text) language plpgsql security definer set search_path='' as $$
begin
  if not firstpatch_private.job_ok(p_key) then raise exception 'Forbidden' using errcode='42501'; end if;
  return query select f.url from public.fp_pr_facts f where f.state in ('open','unavailable') and f.checked_at<now()-interval '24 hours'
    and exists(select 1 from public.fp_linked_prs l join public.fp_preferences p on p.user_id=l.user_id where l.pr_url=f.url and p.last_active_at>now()-interval '30 days')
    order by f.checked_at limit 5;
end $$;
revoke all on function public.fp_due_prs(text) from public;
grant execute on function public.fp_due_prs(text) to anon;

