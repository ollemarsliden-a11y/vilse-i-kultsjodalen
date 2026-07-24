-- ===================================================================
--  GDPR: låt en inloggad användare radera sitt eget konto.
--  Kör i Supabase SQL Editor (en gång). Klientens deleteMyAccount()
--  raderar först användarens rader och foton, sedan anropas denna
--  RPC som tar bort själva auth-kontot.
-- ===================================================================

create or replace function public.vik_delete_me()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Inte inloggad';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.vik_delete_me() from public;
grant execute on function public.vik_delete_me() to authenticated;

-- Kom ihåg också (görs i dashboarden, inte SQL):
--   Project Settings → General → Region: bekräfta att projektet ligger i EU.
