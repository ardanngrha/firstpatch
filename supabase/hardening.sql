-- GitHub provider claims are issued in protected app_metadata, not editable user_metadata.
alter policy own_preferences on public.fp_preferences
  using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github')
  with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github');
alter policy own_saved on public.fp_saved
  using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github')
  with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github');
alter policy own_links on public.fp_linked_prs
  using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github')
  with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'provider')='github');
revoke all on function public.fp_record_pr(text,jsonb),public.fp_due_prs_batch(text),public.fp_due_prs(text) from public,anon,authenticated;
grant execute on function public.fp_record_pr(text,jsonb),public.fp_due_prs_batch(text) to service_role;
