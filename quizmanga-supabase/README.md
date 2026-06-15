# QuizManga — Supabase backend bilan

Bu — haqiqiy backend (Supabase) ga ulangan test platformasi. Haqiqiy ro'yxatdan o'tish, email tasdiqlash, parol tiklash, bulutda ma'lumotlar saqlash va xavfsizlik (RLS) bilan.

---

## 📋 Nimalar kerak
- **Node.js 18+** — https://nodejs.org dan o'rnating (`node -v` bilan tekshiring)
- **Supabase akkaunti** — https://supabase.com (bepul)

---

## 🚀 1-QADAM: Supabase loyihasini yaratish

1. https://supabase.com ga kiring → **Start your project** → akkaunt oching
2. **New project** bosing. Nom bering (masalan `quizmanga`), kuchli **Database Password** kiriting (saqlab qo'ying), region tanlang (Frankfurt yaqin) → **Create**
3. Loyiha tayyor bo'lishini ~2 daqiqa kuting

## 🗄️ 2-QADAM: Ma'lumotlar bazasini sozlash

1. Chap menyuda **SQL Editor** ni oching
2. **New query** bosing
3. `supabase/schema.sql` faylini to'liq ochib, ichidagi hamma narsani nusxalang
4. SQL Editor ga joylang va **Run** (yoki Ctrl+Enter) bosing
5. "Success" chiqsa — bazangiz tayyor ✓

## 🔑 3-QADAM: Kalitlarni olish

1. Chap menyuda **Project Settings** (pastdagi tishli belgi) → **API**
2. Quyidagilarni nusxalang:
   - **Project URL** (masalan `https://abcd1234.supabase.co`)
   - **anon public** key (uzun matn, `eyJ...` bilan boshlanadi)

## ⚙️ 4-QADAM: Loyihani sozlash va ishga tushirish

Terminal (buyruq qatori) ni loyiha papkasida oching va:

```bash
# 1. .env.example dan nusxa olib .env yarating
cp .env.example .env
```

`.env` faylini matn muharririda ochib, kalitlaringizni qo'ying:

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...sizning_kalitingiz
```

Keyin:

```bash
# 2. Kerakli paketlarni o'rnatish (bir marta)
npm install

# 3. Ishga tushirish
npm run dev
```

Terminal `http://localhost:5173` manzilini ko'rsatadi — uni brauzerda oching. 🎉

## 👑 5-QADAM: O'zingizni admin qilish

1. Platformada **ro'yxatdan o'ting** (oddiy email bilan)
2. Emailingizga kelgan **tasdiqlash havolasini** bosing (spam papkasini ham tekshiring)
3. Supabase → **SQL Editor** da quyidagini ishga tushiring (emailni o'zingiznikiga almashtiring):

```sql
update public.profiles set role='admin'
where email = 'sizning@email.com';
```

4. Platformaga qayta kiring — endi **Admin** tugmasi ko'rinadi
5. Admin panel → **Ko'rsatkichlar** → **🌱 Demo savollarni yuklash** bosib, 110 ta tayyor savolni yuklang (yoki o'zingiznikini qo'shing)

---

## 📧 Email sozlamalari (muhim)

Supabase bepul rejada test email'lari cheklangan (soatiga ~3-4 ta). Haqiqiy biznes uchun:
- Supabase → **Authentication** → **Email Templates** dan xatlarni o'zbekchaga moslang
- **Authentication → Providers → Email** da o'z SMTP'ingizni (masalan Resend, SendGrid, Brevo) ulang — shunda cheksiz va ishonchli email yuboriladi

Tez test uchun: **Authentication → Providers → Email → "Confirm email"** ni vaqtincha o'chirib qo'ysangiz, tasdiqlashsiz darrov kirish mumkin.

---

## 🌐 Internetga joylash (deploy)

Loyihani tekinga joylash uchun (masalan **Vercel** yoki **Netlify**):
1. Kodingizni GitHub'ga yuklang
2. Vercel/Netlify'da loyihani import qiling
3. Environment Variables bo'limiga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ni qo'shing
4. Deploy bosing

---

## 🏗️ Loyiha tuzilishi

```
quizmanga/
├─ index.html
├─ package.json
├─ vite.config.js
├─ .env.example          ← kalitlar namunasi
├─ supabase/
│  └─ schema.sql         ← baza sxemasi + xavfsizlik (RLS)
└─ src/
   ├─ main.jsx
   ├─ App.jsx            ← butun ilova (UI)
   └─ lib/
      ├─ supabase.js     ← Supabase mijozi
      └─ api.js          ← auth + ma'lumotlar funksiyalari
```

---

## ✅ Hozir haqiqiy ishlaydigan narsalar
- Ro'yxatdan o'tish + **haqiqiy email tasdiqlash**
- Kirish / chiqish (xavfsiz, shifrlangan parollar — Supabase Auth)
- **Parolni tiklash** (email orqali)
- Rollar: o'quvchi / o'qituvchi / admin (RLS bilan himoyalangan)
- Savollar, testlar, natijalar, bookmarklar — hammasi **bulutda**, har qurilmada bir xil
- Admin: savol CRUD, CSV import, test yaratish, foydalanuvchilarni bloklash, natijalarni eksport
- Ma'lumotlar **xavfsiz** — har kim faqat o'ziga ruxsat etilganini ko'radi (Row Level Security)

## 🔜 Biznes uchun keyingi qadamlar (tavsiya)
- **To'lov tizimi** (Payme/Click/Stripe) — pulli obuna uchun
- Admin uchun barcha foydalanuvchilar natijalari statistikasi
- Email shablonlarini brendlash + o'z SMTP
- Foydalanish shartlari / Maxfiylik siyosati (huquqiy)
- Reyting, gamifikatsiya, sertifikatlar

Savollar bo'lsa — yozing, birga to'ldiramiz.

---

## 🆕 v2 — Xavfsizlik + PRO tarif (to'lov tizimi)

**Agar avval `schema.sql`ni ishga tushirgan bo'lsangiz**, endi qo'shimcha bir marta:
- Supabase → **SQL Editor** → `supabase/migration_v2.sql` ni to'liq joylab **Run** bosing.

Bu nimalarni qo'shadi:
1. **🔒 Xavfsizlik tuzatildi** — endi oddiy foydalanuvchi o'zini admin yoki PRO qilib qo'ya olmaydi (trigger orqali himoyalangan). Bu ishga tushirishdan oldin **muhim**.
2. **⭐ PRO tarif** — `plan` va `pro_until` ustunlari. DTM simulyatori, Marathon va Tezkor test endi faqat PRO uchun.

### PRO tarifni qanday sotasiz (hozir, avtomatik to'lovsiz)
1. Foydalanuvchi ilovada **PRO tarif** sahifasidagi kartaga pul o'tkazadi (karta ma'lumotlarini HTML config'dagi `pay` bo'limiga yozasiz)
2. Chekni sizga (admin) yuboradi
3. Siz **Admin panel → Foydalanuvchilar** da o'sha odamga **PRO+30** tugmasi bilan 30 kunlik PRO berasiz

Bu — O'zbekistonda ko'p startaplar boshlanadigan eng oddiy, ishonchli yo'l. Merchant akkaunt yoki dasturlash kerak emas.

### Keyinchalik: avtomatik to'lov (Payme / Click)
Avtomatlashtirish uchun kerak bo'ladi:
- Payme/Click bilan **merchant shartnoma** (yuridik shaxs/IP kerak)
- **Supabase Edge Function** — to'lov tasdig'ini (webhook) qabul qilib, `profiles.plan` ni avtomatik `pro` qiladi
- Ilovada to'lov tugmasi foydalanuvchini Payme/Click sahifasiga yo'naltiradi

Bu bosqichga yetganda yordam beraman — avval qo'lda sotuvni sinab ko'ring.

### Admin imkoniyatlari (v2)
- Har foydalanuvchining **rolini** o'zgartirish (o'quvchi/o'qituvchi/admin)
- **PRO berish / bekor qilish**
- Barcha foydalanuvchilar natijalari statistikasi + to'liq CSV eksport
- PRO obunachilar soni ko'rsatkichi
