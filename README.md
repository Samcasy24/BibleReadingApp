# Group Bible Reading App

A web app for group Bible reading plans with progress tracking. Built with React + Vite + Supabase. Hosted free on Vercel + Supabase.

## Quick Start

### 1. Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
3. Copy your **Project URL** and **anon key** from Project Settings → API.

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm install
npm run dev
```

### 3. Deploy to Vercel
1. Push this repo to GitHub.
2. Import the repo in [vercel.com](https://vercel.com) — set **Root Directory** to `frontend`.
3. Add the two environment variables in Vercel's project settings.
4. Deploy.

## Project Structure
```
BibleReadingApp/
  frontend/                  React + Vite app
    src/
      components/            Layout, NavBar, ProtectedRoute
      hooks/                 useAuth
      lib/                   Supabase client
      pages/
        auth/                Login, Register
        member/              Dashboard, Today, Plan, Progress, Group
        admin/               Admin panel, GroupProgress
      types/                 TypeScript types
  supabase/
    migrations/              SQL schema + RLS policies
  Specifications/            Project spec versions
```

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Hosting | Vercel (frontend) + Supabase (free tier) |

## First Admin
After registering your first account, run this in the Supabase SQL Editor to make yourself an admin:
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```
