# Quizmania Deployment & Operations Guide

## 1. Hosting Architecture
- **Frontend:** Vercel (or Netlify / Cloudflare Pages)
- **Backend / Database:** Supabase Cloud (PostgreSQL 15+ with Realtime)

---

## 2. Setting Up Supabase Cloud

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Copy the contents of [`supabase/migrations/20261111_init_quizmania.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/migrations/20261111_init_quizmania.sql) and click **Run**.
4. Copy the contents of [`supabase/seed.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/seed.sql) and click **Run** to seed all 20 questions and the competition record.
5. In **Project Settings** -> **API**, copy:
   - `Project URL`
   - `anon public key`

---

## 3. Deploying Frontend to Vercel

### Method A: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Method B: Deploy via GitHub / Vercel Web Dashboard
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Configure the **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_ADMIN_PIN`: `quizmania2026` (or your secret organizer PIN)
4. Click **Deploy**.

---

## 4. Pre-Competition Rehearsal Checklist

Never deploy or run on competition day without a prior rehearsal. Follow this checklist:

- [ ] **2 Days Before:** Perform a simulated 60-participant rehearsal using `npm run test:concurrency`.
- [ ] **1 Day Before:**
  - Verify auditorium projector connects to a laptop running `https://your-domain.vercel.app/#leaderboard`.
  - Click *"Auditorium Projector Mode"* to verify typography and contrast under hall lighting.
  - Verify Wi-Fi network in the examination hall supports 60 active devices without DHCP IP pool exhaustion.
- [ ] **Competition Morning:**
  - Organizer opens `/#admin` and unlocks with PIN.
  - Set status to **Registration Open**.
  - Students connect to the local Wi-Fi and register with Name, School, and Class.
  - Organizer monitors the registered students count reaching the expected total.
  - Close registration.
  - Click **Start Round 1**.
  - Review live submissions progress bar as each question elapses.

