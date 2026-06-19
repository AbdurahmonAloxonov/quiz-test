-- ═══════════════════════════════════════════════════════════════
-- FanlarEdu — MIGRATSIYA v4
-- "Bitta akkaunt = bitta qurilma" cheklovi uchun
-- Supabase → SQL Editor da bir marta RUN qiling.
-- ═══════════════════════════════════════════════════════════════

-- Har profilga oxirgi kirgan qurilma identifikatori
alter table public.profiles add column if not exists device_id text;

-- Foydalanuvchi o'z profilini (jumladan device_id) yangilay olishi
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
