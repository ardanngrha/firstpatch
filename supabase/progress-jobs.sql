create function public.fp_due_prs_batch(p_key text) returns setof public.fp_pr_facts language plpgsql security definer set search_path='' as $$
begin
  if not firstpatch_private.job_ok(p_key) then raise exception 'Forbidden' using errcode='42501'; end if;
  return query select f.* from public.fp_pr_facts f
  where ((f.state in ('open','unavailable') and f.checked_at<now()-interval '24 hours') or (f.state='closed' and f.checked_at<now()-interval '7 days'))
    and exists(select 1 from public.fp_linked_prs l join public.fp_preferences p on p.user_id=l.user_id where l.pr_url=f.url and p.last_active_at>now()-interval '30 days')
    order by f.checked_at limit 5;
end $$;
revoke all on function public.fp_due_prs_batch(text) from public,authenticated;
grant execute on function public.fp_due_prs_batch(text) to anon;
revoke all on function public.fp_due_prs(text) from public,anon,authenticated;
