-- ═══════════════════════════════════════════════════════════════
-- QuizManga — MIGRATSIYA v2 (xavfsizlik + Pro tarif)
-- Agar avval schema.sql'ni ishga tushirgan bo'lsangiz, FAQAT shuni
-- Supabase → SQL Editor da bir marta RUN qiling.
-- (Yangi baza uchun esa to'liq schema.sql'ning o'zi yetarli.)
-- ═══════════════════════════════════════════════════════════════

-- 1. Pro tarif ustunlari
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists pro_until timestamptz;
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free','pro'));

-- 2. XAVFSIZLIK: oddiy foydalanuvchi o'zini admin/pro qila olmasin
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.role      := old.role;
  new.blocked   := old.blocked;
  new.plan      := old.plan;
  new.pro_until := old.pro_until;
  return new;
end; $$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile_fields();
