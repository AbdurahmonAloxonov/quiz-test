-- ═══════════════════════════════════════════════════════════════
-- QuizManga — MIGRATSIYA v3
-- Promokod + O'qituvchi guruhlari + E'lonlar
-- Supabase → SQL Editor da bir marta RUN qiling.
-- ═══════════════════════════════════════════════════════════════

-- ── Himoya triggeriga "bypass" qo'shamiz (promokod uchun) ──
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin()
     or coalesce(current_setting('app.bypass_protect', true),'') = 'on' then
    return new;
  end if;
  new.role := old.role; new.blocked := old.blocked;
  new.plan := old.plan; new.pro_until := old.pro_until;
  return new;
end; $$;

-- ════════ 1. PROMOKODLAR ════════
create table if not exists public.promo_codes (
  code        text primary key,
  days        int  not null default 30,
  max_uses    int  not null default 0,   -- 0 = cheksiz
  used_count  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
drop policy if exists "promo_staff_all" on public.promo_codes;
create policy "promo_staff_all" on public.promo_codes for all
  using (public.is_staff()) with check (public.is_staff());

-- Promokodni faollashtirish (har qanday foydalanuvchi o'ziga)
create or replace function public.redeem_promo(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare c record; uid uuid := auth.uid();
begin
  if uid is null then return 'auth'; end if;
  select * into c from public.promo_codes
    where lower(code) = lower(trim(p_code)) and active = true;
  if not found then return 'invalid'; end if;
  if c.max_uses > 0 and c.used_count >= c.max_uses then return 'used'; end if;
  update public.promo_codes set used_count = used_count + 1 where code = c.code;
  perform set_config('app.bypass_protect','on',true);
  update public.profiles
    set plan = 'pro',
        pro_until = greatest(coalesce(pro_until, now()), now()) + (c.days || ' days')::interval
    where id = uid;
  return 'ok:' || c.days;
end; $$;
grant execute on function public.redeem_promo(text) to authenticated;

-- ════════ 2. O'QITUVCHI GURUHLARI ════════
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text unique not null,
  teacher_id  uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id   uuid references public.groups(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups for select using (
  teacher_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.group_members m where m.group_id = id and m.user_id = auth.uid())
);
drop policy if exists "groups_write" on public.groups;
create policy "groups_write" on public.groups for all
  using (teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "gm_select" on public.group_members;
create policy "gm_select" on public.group_members for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid())
);
drop policy if exists "gm_delete" on public.group_members;
create policy "gm_delete" on public.group_members for delete using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid())
);

-- O'qituvchi guruh a'zolarining profillarini va natijalarini ko'ra olishi
drop policy if exists "profiles_staff_select" on public.profiles;
create policy "profiles_staff_select" on public.profiles for select using (public.is_staff());

drop policy if exists "results_teacher_view" on public.test_results;
create policy "results_teacher_view" on public.test_results for select using (
  exists (select 1 from public.group_members m
          join public.groups g on g.id = m.group_id
          where m.user_id = test_results.user_id and g.teacher_id = auth.uid())
);

-- Guruhga kod bilan qo'shilish
create or replace function public.join_group(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare g record; uid uuid := auth.uid();
begin
  if uid is null then return 'auth'; end if;
  select * into g from public.groups where lower(code) = lower(trim(p_code));
  if not found then return 'invalid'; end if;
  insert into public.group_members(group_id, user_id) values (g.id, uid)
    on conflict do nothing;
  return 'ok:' || g.name;
end; $$;
grant execute on function public.join_group(text) to authenticated;

-- ════════ 3. E'LONLAR ════════
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text default '',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "ann_read" on public.announcements;
create policy "ann_read" on public.announcements for select using (auth.role() = 'authenticated');
drop policy if exists "ann_staff_write" on public.announcements;
create policy "ann_staff_write" on public.announcements for all
  using (public.is_staff()) with check (public.is_staff());
