-- ===================================================================
--  Ortnamn — byns egna namn på landskapet
-- ===================================================================
--  Kör i Supabase → SQL Editor → New query → klistra in → Run.
--
--  Vikar, myrar, holmar, älgpass och slåtterängar som bara har namn i
--  muntlig tradition. Poängen är inte att hitta dit — det är att namnet
--  och berättelsen finns kvar när den som kan dem är borta.
--
--  Fältet uppgiftslamnare är PERSONUPPGIFT när personen lever. Fråga
--  alltid innan du skriver dit ett namn. Se integritetspolicyn i appen.
-- ===================================================================

create table if not exists public.vik_ortnamn (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  namn text not null check (char_length(namn) between 1 and 80),
  typ  text not null,                       -- vik, myr, holme, tjarn, ang…
  sprak text not null default 'sv',         -- sv | sma (sydsamiska)
  berattelse      text check (char_length(berattelse) <= 2000),
  uppgiftslamnare text check (char_length(uppgiftslamnare) <= 160),
  bild text,                                -- foto (publik URL i vik-photos)
  lat double precision not null,
  lng double precision not null,
  status text not null default 'visible' check (status in ('visible','flagged','hidden'))
);

alter table public.vik_ortnamn enable row level security;

-- Alla får läsa synliga namn (även utloggade — det är ju poängen).
drop policy if exists "ortnamn_las" on public.vik_ortnamn;
create policy "ortnamn_las" on public.vik_ortnamn
  for select using (status = 'visible' or auth.uid() = user_id);

-- Inloggade får lägga till, men bara i eget namn.
drop policy if exists "ortnamn_skriv" on public.vik_ortnamn;
create policy "ortnamn_skriv" on public.vik_ortnamn
  for insert with check (auth.uid() = user_id);

-- Bara den som lagt in namnet (eller admin) får ändra och ta bort.
drop policy if exists "ortnamn_andra" on public.vik_ortnamn;
create policy "ortnamn_andra" on public.vik_ortnamn
  for update using (public.vik_is_admin() or auth.uid() = user_id);

drop policy if exists "ortnamn_radera" on public.vik_ortnamn;
create policy "ortnamn_radera" on public.vik_ortnamn
  for delete using (public.vik_is_admin() or auth.uid() = user_id);

create index if not exists vik_ortnamn_pos on public.vik_ortnamn (lat, lng);

-- Lades till i efterhand — kör den här raden om tabellen redan finns:
alter table public.vik_ortnamn add column if not exists bild text;
