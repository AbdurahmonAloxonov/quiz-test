-- ═══════════════════════════════════════════════════════════════
-- QuizManga — Supabase ma'lumotlar bazasi sxemasi
-- Supabase Dashboard → SQL Editor ga to'liq nusxalab, RUN bosing.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PROFILES (auth.users bilan bog'langan) ──────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Foydalanuvchi',
  email       text,
  role        text not null default 'student' check (role in ('student','teacher','admin')),
  avatar      text not null default '🦊',
  blocked     boolean not null default false,
  plan        text not null default 'free' check (plan in ('free','pro')),
  pro_until   timestamptz,
  created_at  timestamptz not null default now()
);

-- ── 2. QUESTIONS ────────────────────────────────────────────────
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  subject_id  int  not null,
  q           text not null,
  options     jsonb not null,          -- ["A","B","C","D"]
  answer      jsonb not null,          -- 1  yoki  [0,2] (ko'p javobli)
  multi       boolean not null default false,
  diff        text not null default 'easy' check (diff in ('easy','medium','hard')),
  topic       text default '',
  exp         text default '',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists questions_subject_idx on public.questions(subject_id);

-- ── 3. CUSTOM TESTS ─────────────────────────────────────────────
create table if not exists public.custom_tests (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  icon        text default '🎯',
  color       text default '#4F6EF7',
  descr       text default '',
  subjects    jsonb not null,          -- [8,1,2]
  counts      jsonb not null,          -- [10,30,30]
  time_min    int not null default 30,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── 4. TEST RESULTS ─────────────────────────────────────────────
create table if not exists public.test_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  type        text default 'subject',
  subject_id  int,
  score       int not null,
  total       int not null,
  pct         int not null,
  created_at  timestamptz not null default now()
);
create index if not exists results_user_idx on public.test_results(user_id);

-- ── 5. BOOKMARKS ────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  uuid not null references public.questions(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user_id, question_id)
);

-- ═══════════════════════════════════════════════════════════════
-- YANGI FOYDALANUVCHI uchun profil avtomatik yaratish
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Foydalanuvchi'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'avatar', '🦊')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ADMIN tekshiruvi (RLS uchun) ───────────────────────────────
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','teacher')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── XAVFSIZLIK: oddiy foydalanuvchi o'zining role/blocked/plan'ini o'zgartira olmaydi ──
-- (faqat admin o'zgartira oladi). Bu privilege-escalation teshigini yopadi.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;                 -- admin hammasini o'zgartira oladi
  end if;
  new.role      := old.role;    -- oddiy foydalanuvchi uchun himoyalangan maydonlar
  new.blocked   := old.blocked;
  new.plan      := old.plan;
  new.pro_until := old.pro_until;
  return new;
end; $$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (xavfsizlik — eng muhim qism!)
-- ═══════════════════════════════════════════════════════════════
alter table public.profiles     enable row level security;
alter table public.questions    enable row level security;
alter table public.custom_tests enable row level security;
alter table public.test_results enable row level security;
alter table public.bookmarks    enable row level security;

-- PROFILES: o'zini ko'radi/tahrirlaydi; admin hammasini ko'radi/boshqaradi
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id);
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_admin());

-- QUESTIONS: barcha kirgan o'qiydi; faqat admin/teacher yozadi
create policy "questions_select" on public.questions for select
  using (auth.role() = 'authenticated');
create policy "questions_write" on public.questions for all
  using (public.is_staff()) with check (public.is_staff());

-- CUSTOM TESTS: barcha kirgan o'qiydi; admin/teacher yozadi
create policy "tests_select" on public.custom_tests for select
  using (auth.role() = 'authenticated');
create policy "tests_write" on public.custom_tests for all
  using (public.is_staff()) with check (public.is_staff());

-- TEST RESULTS: o'zinikini ko'radi/qo'shadi; admin hammasini ko'radi
create policy "results_select_own" on public.test_results for select
  using (auth.uid() = user_id or public.is_admin());
create policy "results_insert_own" on public.test_results for insert
  with check (auth.uid() = user_id);

-- BOOKMARKS: faqat o'zinikini
create policy "bookmarks_all_own" on public.bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- BIRINCHI ADMINNI BELGILASH:
-- Ro'yxatdan o'tgach, quyidagini email'ingiz bilan ishga tushiring:
--   update public.profiles set role='admin'
--   where id = (select id from auth.users where email='SIZNING@email.com');
-- ═══════════════════════════════════════════════════════════════
