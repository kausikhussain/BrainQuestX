# Quizmania — Competitive Technical Quiz Platform

> **A real-time, server-authoritative competitive technical examination platform engineered for school & inter-school competitions with 50–60+ simultaneous participants.**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)
![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e.svg)

---

## 🚀 Key Highlights & Architectural Principles

1. **Server-Authoritative 20-Second Countdown:**
   - The question lifecycle is strictly determined by the server's deadline (`question_deadline = question_start_time + 20s`).
   - The client calculates `remaining = question_deadline - estimatedServerTime`.
   - Browser refreshes, clock manipulations, or tab switches **never grant additional time**.
   - Answer submissions at $t > \text{deadline} + 500\text{ms}$ are automatically rejected by the server.

2. **Zero Answer Key Leakage:**
   - Correct answers and option flags (`isCorrect`) are kept strictly isolated on the backend.
   - Public client queries fetch only candidate-safe questions.

3. **High Concurrency & Low Latency:**
   - Tested under burst loads with **60 concurrent submissions in the same second** (`p50 < 1ms`, `p95 < 1ms`, 0 dropped requests).
   - Realtime is utilized for high-level state changes (question release, round start), while answers are recorded via direct, idempotent database writes.

4. **Multi-Competition Ready:**
   - Competition parameters, rounds, and question banks are decoupled from the application logic, allowing the platform to be reused for future hackathons, college events, and coding contests.

---

## 🏆 Round Structure & Official Questions

The platform comes pre-seeded with the exact questions from the official examination papers:

- **Round 1: General Paper (10 Questions, 20s each)**
  - Source: `Generalpaper.docx`
  - Covers: Communication devices, graphics file formats, MS Word paragraph break keys, Linux OS, educational software, binary-to-decimal conversion ($110111_2 = 55_{10}$), 1 KB byte count (1024), translators (compilers & interpreters), cache memory, and MS Paint file formats.
  
- **Round 2: Subject Paper (Python Programming — 10 Questions, 20s each)**
  - Source: `Subjectpaper.docx`
  - Covers: Father of Python (Guido van Rossum), valid identifiers (`Break`), tuple immutability, `count()` function, default return value (`None`), insertion-ordered types (dict & list), `for...else` mechanics, nested string indexing `li[1][-1]`, `list.index()` calculation, and valid variable names (`my_variable`).

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, Canvas-Confetti
- **Backend / Database:** PostgreSQL 14+, Supabase Cloud, Supabase Realtime, PostgreSQL RPC Functions
- **Dual-Engine Architecture:**
  - **Cloud Mode:** Runs on Supabase with PostgreSQL Row Level Security (RLS) and stored procedures.
  - **Local/Offline Mode:** High-performance, zero-config in-memory & `BroadcastChannel` engine for local school network competitions or rehearsals.

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js `v18+` (Tested on Node `v24.21.0`)
- npm `v9+`

### 2. Installation
```bash
git clone https://github.com/your-org/quizmania.git
cd Quizmania
npm install
```

### 3. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running the 60-Participant Concurrency Load Test
```bash
npm run test:concurrency
```
This runs an automated simulation of 60 simultaneous students registering, handling duplicates, receiving question releases, and submitting answers in a single-second burst.

---

## 🧭 Navigation & Interfaces

| Interface | URL Route | Purpose |
|---|---|---|
| **Student Portal** | `/#` | Minimalist, focused candidate portal (Name, School, Class: 11th or 12th) |
| **Admin Dashboard** | `/#admin` | Organizer control room (PIN: `quizmania2026`). Registration toggle, round starter, question stepper, CSV export |
| **Public Leaderboard** | `/#leaderboard` | Live rankings, podium (1st, 2nd, 3rd) with confetti, and deterministic tie-breaking |
| **Projector Mode** | Click *"Auditorium Projector Mode"* on `/#leaderboard` | Fullscreen, high-contrast, large-typography display for hall projectors |

---

## 🔒 Security Measures

- **No Public Credentials:** Service-role keys are never exposed to browser bundles.
- **Idempotency Keys:** Duplicate answer attempts are safely ignored without double-scoring.
- **No Private Data Stored:** No student email addresses, phone numbers, or passwords are asked.
- **Protected Destructive Actions:** Competition reset requires entering an explicit confirmation phrase: `RESET COMPETITION`.

---

## 📄 License
This project is licensed under the MIT License.

