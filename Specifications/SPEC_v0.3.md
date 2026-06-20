# Group Bible Reading App — Project Specification

**Version:** 0.3
**Date:** 2026-06-20

---

## 1. Overview

A web application that allows a group of people to follow a shared Bible reading plan, track individual and collective progress, and stay accountable to one another. The app is designed to be simple, mobile-friendly, and hosted on a free cloud platform.

---

## 2. Goals

- Provide a single shared reading plan for the entire group.
- Let each member mark readings as complete and share enjoyment and enlightenment.
- Give the Admin visibility into group-wide progress.
- Keep the setup and running costs at zero (free-tier hosting).

---

## 3. User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage groups, assign plans, manage all users, view all data, send reminders, delete groups/plans/members |
| **Member** | View plan, mark readings complete, add enjoyment & enlightenment notes |

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
- Admin can delete plans (cascades to all entries and logs).
- Members are assigned to a plan by the Admin.

### 4.3 Reading Schedule
- Calendar-style view showing:
  - Today's reading highlighted.
  - Past readings (complete / incomplete per member).
  - Upcoming readings.
- Members can view the full plan timeline.

### 4.4 Today's Reading Page
- Displays the scheduled reading reference (book, chapter, verses).
- **Bible text link** — direct link to the passage in the Recovery Version online.
- Member marks the reading as **Complete** or **Skipped**.
- Two optional plain-text note fields (each max 500 characters):
  - **Enjoyment** — "Share your enjoyment in brief with other saints…"
  - **Enlightenment** — brief insight or truth received from the reading.
- Notes are visible to group members by default; member may set to **private**.

### 4.5 Progress Tracking
- Member marks a reading as **Complete** or **Skipped**.
- Admin sees a dashboard with group-wide completion percentages and a per-member progress bar.

### 4.6 Group Management
- Admin creates groups (e.g., "Morning Bible Study", "Youth Group").
- Groups have a name and description.
- Members are added to groups by Admin or via an invite link.
- Admin can edit group details and manage members (add / remove).
- Admin can archive or permanently delete a group.
- Maximum group size: configurable by Admin (default: 50).

### 4.7 User Management
- Admin sees all registered users.
- Admin can change any user's role (member ↔ admin).
- Admin can delete members (not admins) permanently.
- Invite link copied from Admin panel for self-registration.

### 4.8 Notifications & Reminders
- Daily email reminder sent at a configurable time (e.g., 7:00 AM local time).
- Reminder only sent if that day's reading is not yet marked complete.
- Admin can manually send a group reminder message.

### 4.9 Leaderboard (optional / toggle)
- Weekly leaderboard showing members with the highest streak.
- Leaderboard is visible to group members only (not public).
- Admin can enable or disable per group.

---

## 5. Rules & Regulations

### 5.1 Reading Rules
1. Each plan day has exactly one assigned reading segment.
2. A reading may only be marked complete on or after its scheduled date.
3. A member may mark any past reading complete at any time (no catch-up lock).
4. Skipped readings count as incomplete for progress calculations.
5. Readings cannot be un-completed once marked (to encourage honesty).

### 5.2 Group Rules
1. A member may belong to a maximum of **3 groups** simultaneously.
2. Groups require a minimum of **2 members** to be considered active.
3. An inactive group (no activity for 30 days) is automatically archived.

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
5. Admin accounts cannot be deleted by another Admin — role must be changed to member first.

### 5.5 Content Rules
1. Enjoyment and Enlightenment notes are visible to group members by default; members may set them to **private**.
2. No offensive, hateful, or inappropriate content in notes or usernames.
3. Admin may remove any note or user that violates content guidelines.

---

## 6. Tech Stack (Deployed)

| Layer | Choice | Hosting |
|-------|--------|---------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS | Vercel (free) |
| **Database** | PostgreSQL + Row Level Security | Supabase (free) |
| **Authentication** | Supabase Auth | Supabase (free) |
| **Email** | Resend or Brevo | Free tier |

**Live URL:** https://bible-reading-app-ruby.vercel.app

---

## 7. Data Models (high-level)

```
User / Profile
  id, email, username, role, created_at, last_active_at

Group
  id, name, description, plan_id, max_members, is_archived, created_at

GroupMembership
  id, group_id, user_id, joined_at

ReadingPlan
  id, name, description, start_date, end_date, created_by, created_at

PlanEntry
  id, plan_id, scheduled_date, book, chapter_start, verse_start, chapter_end, verse_end

ReadingLog
  id, user_id, plan_entry_id, status (complete|skipped),
  enjoyment (text, max 500), enlightenment (text, max 500),
  is_private, logged_at
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
| Group Progress | `/group/:groupId/progress` | Admin |
| Admin Panel | `/admin` | Admin |
| New Plan | `/admin/plans/new` | Admin |
| New Group | `/admin/groups/new` | Admin |
| Edit Group | `/admin/groups/:id/edit` | Admin |

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
- In-app Bible text reader (links to Recovery Version online instead).
- Video / audio meeting integration.
- Paid subscription tiers.

---

## 11. Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Reflection note format | Plain text only (max 500 chars each) |
| 2 | Bible translation | Recovery Version |
| 3 | Catch-up window | No lock — members can complete any past reading at any time |
| 4 | Leaderboard visibility | Group-private only |
| 5 | Language / locale | English only at launch |
| 6 | Note fields | Two fields: **Enjoyment** and **Enlightenment** |
| 7 | Bible link | Links to Recovery Version online per passage |

---

*This spec is a living document. Update version number and date on each revision.*
