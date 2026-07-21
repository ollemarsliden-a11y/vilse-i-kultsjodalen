-- ===================================================================
--  Vilse i Kultsjödalen — admin-redigering av inbyggda platser
--  (byar & sevärdheter). Kör i Supabase → SQL Editor → Run.
--  Kan köras fristående (definierar vik_is_admin() själv om den saknas).
-- ===================================================================
--  Modell: grunddatan för byar/sevärt ligger i appen (js/data.js). Här
--  lagras ADMINS ändringar som ett "lager ovanpå":
--    vik_place_overrides — text/fakta per plats (jsonb-patch)
--    vik_place_images    — bildgalleri per plats (kan döljas/raderas)
--  Alla kan LÄSA; bara admin (e-post nedan) kan SKRIVA.
-- ===================================================================

-- Admin-check (samma som admin.sql — säker att köra igen).
create or replace function public.vik_is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'email') in (
    'olle.marsliden@gmail.com'
  ), false);
$$;

-- 1. TEXT-ÄNDRINGAR (en rad per plats, patch = ändrade fält)
create table if not exists public.vik_place_overrides (
  place_id   text primary key,
  patch      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- 2. BILDGALLERI (flera bilder per plats, admin-hanterat)
create table if not exists public.vik_place_images (
  id         uuid primary key default gen_random_uuid(),
  place_id   text not null,
  url        text not null,
  caption    text check (char_length(caption) <= 200),
  sort       int  not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists vik_place_images_place on public.vik_place_images (place_id);

-- ---------------- Row Level Security ----------------
alter table public.vik_place_overrides enable row level security;
alter table public.vik_place_images    enable row level security;

-- Overrides: alla läser, bara admin skriver.
drop policy if exists place_overrides_read   on public.vik_place_overrides;
drop policy if exists place_overrides_insert on public.vik_place_overrides;
drop policy if exists place_overrides_update on public.vik_place_overrides;
drop policy if exists place_overrides_delete on public.vik_place_overrides;
create policy place_overrides_read   on public.vik_place_overrides for select using (true);
create policy place_overrides_insert on public.vik_place_overrides for insert with check (public.vik_is_admin());
create policy place_overrides_update on public.vik_place_overrides for update using (public.vik_is_admin()) with check (public.vik_is_admin());
create policy place_overrides_delete on public.vik_place_overrides for delete using (public.vik_is_admin());

-- Bilder: alla ser icke-dolda; admin ser alla + skriver.
drop policy if exists place_images_read   on public.vik_place_images;
drop policy if exists place_images_insert on public.vik_place_images;
drop policy if exists place_images_update on public.vik_place_images;
drop policy if exists place_images_delete on public.vik_place_images;
create policy place_images_read   on public.vik_place_images for select using (hidden = false or public.vik_is_admin());
create policy place_images_insert on public.vik_place_images for insert with check (public.vik_is_admin());
create policy place_images_update on public.vik_place_images for update using (public.vik_is_admin()) with check (public.vik_is_admin());
create policy place_images_delete on public.vik_place_images for delete using (public.vik_is_admin());

-- ---------------- STEG 2 ----------------

-- 3. Låt INLOGGADE användare bidra bilder till en plats (modereras via hidden).
--    Admin kan fortf. dölja/ta bort allt; användare får radera sina egna.
drop policy if exists place_images_insert on public.vik_place_images;
create policy place_images_insert on public.vik_place_images for insert
  with check (public.vik_is_admin() or auth.uid() = created_by);
drop policy if exists place_images_delete on public.vik_place_images;
create policy place_images_delete on public.vik_place_images for delete
  using (public.vik_is_admin() or auth.uid() = created_by);

-- 4. DELADE GPX-TURER (kan knytas till en by via village_id).
create table if not exists public.vik_routes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  village_id text,
  name  text not null check (char_length(name) between 1 and 120),
  gpx   text not null,
  start_lat double precision,
  start_lng double precision,
  distance_km double precision,
  ascent int,
  status text not null default 'visible' check (status in ('visible','flagged','hidden'))
);
create index if not exists vik_routes_village on public.vik_routes (village_id);
alter table public.vik_routes enable row level security;
drop policy if exists routes_read   on public.vik_routes;
drop policy if exists routes_insert on public.vik_routes;
drop policy if exists routes_update on public.vik_routes;
drop policy if exists routes_delete on public.vik_routes;
create policy routes_read   on public.vik_routes for select using (status = 'visible' or auth.uid() = user_id or public.vik_is_admin());
create policy routes_insert on public.vik_routes for insert with check (auth.uid() = user_id);
create policy routes_update on public.vik_routes for update using (auth.uid() = user_id or public.vik_is_admin());
create policy routes_delete on public.vik_routes for delete using (auth.uid() = user_id or public.vik_is_admin());

-- 5. Knyt användartips till en by (valfritt). Tips med village_id visas i den
--    byns hub oavsett exakt läge; tips utan village_id visas via närhet.
alter table public.vik_tips add column if not exists village_id text;

-- Klart. Admin loggar in i appen (samma e-post) → redigeringsknappar dyker upp.
