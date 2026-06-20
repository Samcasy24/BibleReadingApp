# Group Bible Reading App — Project Specification

**Version:** 0.1 (draft)
**Date:** 2026-06-20

---

## 1. Overview

A web application that allows a group of people to follow a shared Bible reading plan, track individual and collective progress, and stay accountable to one another. The app is designed to be simple, mobile-friendly, and hosted on a free cloud platform.

---

## 2. Goals

- Provide a single shared reading plan for the entire group.
- Let each member mark readings as complete and log reflections.
- Give leaders visibility into group-wide progress.
- Keep the setup and running costs at zero (free-tier hosting).

---

## 3. User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage groups, assign plans, manage all users, view all data |
| **Group Leader** | View group member progress, send reminders, manage group plan |
| **Member** | View plan, mark readings complete, add personal notes |

---

## 4. Core Features

### 4.1 Authentication
- Email + password sign-up / login.
- Password reset via email.
- Optional: Google / social login (OAuth).
- Session management with secure JWT or session cookie.

### 4.2 Bible Reading Plans
- Admin can create a reading plan with:
  - Plan name and description.
  - Start date and end date.
  - Daily or weekly reading assignments (book, chapter(s), verse range).
- Plans can be duplicated and edited.
- Members are assigned to a plan by the Admin or Group Leader.

### 4.3 Reading Schedule
- Calendar-style view showing:
  - Today's reading highlighted.
  - Past readings (complete / incomplete per member).
  - Upcoming readings.
- Members can view the full plan timeline.

### 4.4 Progress Tracking
- Member marks a reading as **Complete** or **Skipped**.
- Optional: member adds a short reflection note (max 500 characters).
- Group Leader sees an aggregate progress bar per member.
- Admin sees a dashboard with group-wide completion percentages.

### 4.5 Group Management
- Admin creates groups (e.g., "Morning Bible Study", "Youth Group").
- Groups have a name, description, and assigned Group Leader.
- Members are added to groups by Admin or via an invite link.
- Maximum group size: configurable by Admin (default: 50).

### 4.6 Notifications & Reminders
- Daily email reminder sent at a configurable time (e.g., 7:00 AM local time).
- Reminder only sent if that day's reading is not yet marked complete.
- Group Leader can manually send a group reminder message.

### 4.7 Leaderboard (optional / toggle)
- Weekly leaderboard showing members with the highest streak.
- Admin can enable or disable per group.

---

## 5. Rules & Regulations

### 5.1 Reading Rules
1. Each plan day has exactly one assigned reading segment.
2. A reading may only be marked complete on or after its scheduled date.
3. A member may mark a past reading complete (catch-up) within **7 days** of the scheduled date. After 7 days, it is locked as **Missed**.
4. Skipped readings count as incomplete for progress calculations.
5. Readings cannot be un-completed once marked (to encourage honesty).

### 5.2 Group Rules
1. A member may belong to a maximum of **3 groups** simultaneously.
2. A Group Leader must be an active member of their own group.
3. Groups require a minimum of **2 members** to be considered active.
4. An inactive group (no activity for 30 days) is automatically archived.

### 5.3 Plan Rules
1. A plan must have a name, at least one reading entry, and a start date.
2. Reading entries must not overlap (no two entries on the same date for the same plan).
3. A plan that has started cannot have past entries edited.
4. Plans must cover continuous dates (no gaps of more than 7 days).

### 5.4 User Rules
1. Usernames must be between 3–30 characters (alphanumeric, underscores allowed).
2. Passwords must be at least 8 characters, contain at least one number and one letter.
3. A user account inactive for **12 months** will be flagged for deletion (user is notified 30 days in advance).
4. Users may delete their own account at any time; this removes all personal notes but preserves group completion statistics anonymously.

### 5.5 Content Rules
1. Reflection notes are public to group members by default; members may set a note to **private**.
2. No offensive, hateful, or inappropriate content in notes or usernames.
3. Admin may remove any note or user that violates content guidelines.

---

## 6. Tech Stack Recommendations (Free Hosting)

| Layer | Choice | Free Tier |
|-------|--------|-----------|
| **Frontend** | React + Vite (static site) | Vercel / Netlify |
| **Backend API** | Node.js (Express) or Python (FastAPI) | Render / Railway / Fly.io |
| **Database** | PostgreSQL | Supabase (500 MB free) or Neon (0.5 GB free) |
| **Authentication** | Supabase Auth or Firebase Auth | Free tier both |
| **Email** | Resend or Brevo (Sendinblue) | Free tier (100–300 emails/day) |
| **File Storage** | Supabase Storage or Cloudinary | Free tier |

> **Recommended stack:** React (Vite) frontend on Vercel + Supabase for database, auth, and storage. This gives the most capabilities within free limits with the least operational overhead.

---

## 7. Data Models (high-level)

```
User
  id, email, username, password_hash, role, created_at, last_active_at

Group
  id, name, description, leader_id, plan_id, max_members, is_archived, created_at

GroupMembership
  id, group_id, user_id, joined_at

ReadingPlan
  id, name, description, start_date, end_date, created_by, created_at

PlanEntry
  id, plan_id, scheduled_date, book, chapter_start, verse_start, chapter_end, verse_end

ReadingLog
  id, user_id, plan_entry_id, status (complete|skipped|missed), note, is_private, logged_at
```

---

## 8. Pages / Routes

| Page | Path | Access |
|------|------|--------|
| Landing / Login | `/` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Member+ |
| Today's Reading | `/reading/today` | Member+ |
| Reading Plan | `/plan/:planId` | Member+ |
| My Progress | `/progress` | Member+ |
| Group Overview | `/group/:groupId` | Member+ |
| Group Progress | `/group/:groupId/progress` | Leader+ |
| Admin Panel | `/admin` | Admin |

---

## 9. Non-Functional Requirements

- **Responsive:** Works on mobile, tablet, and desktop.
- **Performance:** Initial page load under 3 seconds on a 4G connection.
- **Accessibility:** WCAG 2.1 AA compliance target.
- **Security:** HTTPS only, OWASP Top 10 mitigations applied, no plaintext passwords stored.
- **Privacy:** GDPR-friendly — users can export and delete their data.

---

## 10. Out of Scope (v1)

- Native mobile app (iOS / Android).
- In-app Bible text reader (links to external Bible resources instead).
- Video / audio meeting integration.
- Paid subscription tiers.

---

## 11. Open Questions

1. Should reflection notes support rich text (bold, lists) or plain text only?
2. Which Bible translation(s) should be referenced in plan entries?
3. Should catch-up window (currently 7 days) be configurable per group?
4. Is a public leaderboard desired, or should it be group-private only?
5. What languages / locales need to be supported at launch?

---

*This spec is a living document. Update version number and date on each revision.*
