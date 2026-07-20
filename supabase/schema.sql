-- ===================================================================
--  Vilse i Kultsjödalen — Supabase-schema (community-backend)
-- ===================================================================
--  Kör i Supabase → SQL Editor → New query → klistra in → Run.
--  Tabeller prefixas vik_ så de kan samexistera med andra projekt.
--  RLS (Row Level Security): alla kan LÄSA synliga tips, men bara ägaren
--  kan ändra/radera sina egna. Foton i publik bucket 'vik-photos'.
-- ===================================================================

-- 1. TIPS (användarnas platser/smultronställen)
create table if not exists public.vik_tips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  edited_at  timestamptz,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  category    text not null,
  description text check (char_length(description) <= 2000),
  lat  double precision not null,
  lng  double precision not null,
  image_url text,
  season text not null default 'all'    check (season in ('all','summer','winter')),
  status text not null default 'visible' check (status in ('visible','flagged','hidden'))
);

-- 2. KOMMENTARER
create table if not exists public.vik_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tip_id  uuid not null references public.vik_tips(id) on delete cascade,
  user_id uuid not null references auth.users(id)     on delete cascade,
  body text not null check (char_length(body) between 1 and 1000)
);

-- 3. REAKTIONER (been_here / favorite / recommend)
create table if not exists public.vik_reactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tip_id  uuid not null references public.vik_tips(id) on delete cascade,
  user_id uuid not null references auth.users(id)     on delete cascade,
  kind text not null check (kind in ('been_here','favorite','recommend')),
  unique (tip_id, user_id, kind)
);

-- 4. RAPPORTER (flaggning)
create table if not exists public.vik_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tip_id      uuid not null references public.vik_tips(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  note   text,
  resolved boolean not null default false
);

-- 5. PROFILER (valfritt visningsnamn)
create table if not exists public.vik_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now()
);

-- ---------------- Row Level Security ----------------
alter table public.vik_tips      enable row level security;
alter table public.vik_comments  enable row level security;
alter table public.vik_reactions enable row level security;
alter table public.vik_reports   enable row level security;
alter table public.vik_profiles  enable row level security;

-- Tips: alla ser synliga; ägaren ser även sina dolda. Skapa/ändra/radera egna.
drop policy if exists tips_read   on public.vik_tips;
drop policy if exists tips_insert on public.vik_tips;
drop policy if exists tips_update on public.vik_tips;
drop policy if exists tips_delete on public.vik_tips;
create policy tips_read   on public.vik_tips for select using (status = 'visible' or auth.uid() = user_id);
create policy tips_insert on public.vik_tips for insert with check (auth.uid() = user_id);
create policy tips_update on public.vik_tips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tips_delete on public.vik_tips for delete using (auth.uid() = user_id);

-- Kommentarer
drop policy if exists comments_read   on public.vik_comments;
drop policy if exists comments_insert on public.vik_comments;
drop policy if exists comments_delete on public.vik_comments;
create policy comments_read   on public.vik_comments for select using (true);
create policy comments_insert on public.vik_comments for insert with check (auth.uid() = user_id);
create policy comments_delete on public.vik_comments for delete using (auth.uid() = user_id);

-- Reaktioner
drop policy if exists reactions_read   on public.vik_reactions;
drop policy if exists reactions_insert on public.vik_reactions;
drop policy if exists reactions_delete on public.vik_reactions;
create policy reactions_read   on public.vik_reactions for select using (true);
create policy reactions_insert on public.vik_reactions for insert with check (auth.uid() = user_id);
create policy reactions_delete on public.vik_reactions for delete using (auth.uid() = user_id);

-- Rapporter: inloggad skapar; bara egna syns (moderering i dashboard).
drop policy if exists reports_insert   on public.vik_reports;
drop policy if exists reports_read_own on public.vik_reports;
create policy reports_insert   on public.vik_reports for insert with check (auth.uid() = reporter_id);
create policy reports_read_own on public.vik_reports for select using (auth.uid() = reporter_id);

-- Profiler
drop policy if exists profiles_read   on public.vik_profiles;
drop policy if exists profiles_insert on public.vik_profiles;
drop policy if exists profiles_update on public.vik_profiles;
create policy profiles_read   on public.vik_profiles for select using (true);
create policy profiles_insert on public.vik_profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.vik_profiles for update using (auth.uid() = id);

-- ---------------- Auto-dölj vid 3+ öppna rapporter ----------------
create or replace function public.vik_autohide() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from public.vik_reports where tip_id = new.tip_id and not resolved) >= 3 then
    update public.vik_tips set status = 'flagged' where id = new.tip_id and status = 'visible';
  end if;
  return new;
end; $$;
drop trigger if exists vik_autohide_trg on public.vik_reports;
create trigger vik_autohide_trg after insert on public.vik_reports
  for each row execute function public.vik_autohide();

-- ---------------- Lagring: publik bucket för foton ----------------
insert into storage.buckets (id, name, public)
values ('vik-photos', 'vik-photos', true)
on conflict (id) do nothing;

-- Alla kan läsa; inloggade laddar upp/raderar i SIN egen mapp (<uid>/fil.webp).
drop policy if exists vik_photos_read   on storage.objects;
drop policy if exists vik_photos_insert on storage.objects;
drop policy if exists vik_photos_delete on storage.objects;
create policy vik_photos_read   on storage.objects for select using (bucket_id = 'vik-photos');
create policy vik_photos_insert on storage.objects for insert with check (bucket_id = 'vik-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy vik_photos_delete on storage.objects for delete using (bucket_id = 'vik-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Klart. Aktivera sedan e-postinloggning (magic link) under Authentication.
