-- ===================================================================
--  Vilse i Kultsjödalen — admin/moderering (kör EFTER schema.sql)
-- ===================================================================
--  Ger admin (e-post nedan) rätt att läsa alla rapporter + alla tips
--  (även dolda) samt dölja/återställa/radera. Ändra e-posten om du vill
--  ha fler moderatorer. Kör i Supabase → SQL Editor → Run.
-- ===================================================================

create or replace function public.vik_is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'email') in (
    'olle.marsliden@gmail.com'
  ), false);
$$;

-- Rapporter: admin ser alla + kan markera lösta
drop policy if exists reports_admin_read   on public.vik_reports;
drop policy if exists reports_admin_update on public.vik_reports;
create policy reports_admin_read   on public.vik_reports for select using (public.vik_is_admin());
create policy reports_admin_update on public.vik_reports for update using (public.vik_is_admin());

-- Tips: admin ser alla (även dolda), kan ändra status och radera
drop policy if exists tips_admin_read   on public.vik_tips;
drop policy if exists tips_admin_update on public.vik_tips;
drop policy if exists tips_admin_delete on public.vik_tips;
create policy tips_admin_read   on public.vik_tips for select using (public.vik_is_admin());
create policy tips_admin_update on public.vik_tips for update using (public.vik_is_admin()) with check (public.vik_is_admin());
create policy tips_admin_delete on public.vik_tips for delete using (public.vik_is_admin());
