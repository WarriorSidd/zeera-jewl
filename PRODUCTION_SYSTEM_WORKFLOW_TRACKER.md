# Real Production Workflow Tracker

## Goal
Make the app behave like a real production system:

- Owner/manager users can create and manage all production tickets.
- Karigar users can see only tickets assigned to them.
- Karigars can accept/reject/start/complete work and upload evidence/updates.
- Ticket status changes automatically from karigar actions.
- Real owner and karigar test accounts exist for verification.

## Confirmed Decisions (from Owner)
- **Database:** PostgreSQL hosted on **Neon** (`postgresql+asyncpg`). No more SQLite for production.
- **Karigar Accept:** Accepting work auto-moves ticket **Assigned → Accepted**.
- **Account creation:** The **Owner** creates Karigar accounts from a dedicated admin UI (`/admin/users`) or seed script.
- **Assignment → Visibility:** When Owner assigns a task to a karigar, that karigar sees **only that assigned task** on their board.
- **Mobile friendly:** UI is responsive for phone/tablet use.
- **Image upload / Evidence:** Karigar/Owner can upload image URLs & evidence visible inside the ticket attachments tab.
- **Comments:** Owner↔Karigar threaded updates inside the ticket with author names.
- **Owner ping:** Owner can ping a karigar which records a timeline entry & notification event (`POST /{id}/ping`).
- **Timestamps:** Track created, assigned, accepted, and every status-change time with full audit history.

## Implementation Status

- [x] Audited current auth, user roles, production models, routes, and frontend API usage.
- [x] Switched backend to PostgreSQL (Neon) connection.
- [x] Backend role-based ticket visibility (karigar sees only assigned tickets).
- [x] Backend karigar accept/reject/start/complete actions (`/accept`, `/reject`, `/start-work`, `/complete-work`).
- [x] Backend notification & ping system (assign + owner-ping timeline events).
- [x] Image/evidence attachment endpoints + gallery display on ticket detail page.
- [x] Seed script + Owner admin account creation UI (`/admin/users`).
- [x] Frontend role-based views (Manager vs Karigar board & navigation).
- [x] Frontend assignment UI, Karigar action bar (Accept / Reject / Start Work / Complete Work), image link upload, comments, ping.
- [x] Mobile-responsive layout.
- [x] Verification with real owner + karigar test accounts.

## Design Notes

- Server-side authorization is mandatory. Backend enforces every permission (`require_manager`, `require_ticket_access`, role filtering in list endpoints).
- Owner, admin, production manager, office, QC roles → broad production access.
- Karigar role → only tickets where `ticket_assignments.assignee_id` equals their user ID.
- Karigar actions append timeline, activity, and audit history records so the ticket remains 100% auditable.
- Every status change records timestamp (`created_at`, `updated_at`, `accepted_at`, `ticket_history`).

## Test Accounts

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| Owner | `owner` | `Owner1234` | Creates tickets, assigns karigars, pings, creates users (`/admin/users`) |
| Karigar 1 | `karigar1` | `Karigar1234` | Accepts/works assigned tickets |
| Karigar 2 | `karigar2` | `Karigar1234` | Second karigar account for multi-assignment testing |

## Verification Log

1. **DB Connection & Seeding:**
   - Seeded DB on Neon PostgreSQL with standard bcrypt password hashes for `owner`, `karigar1`, and `karigar2`.

2. **Server-Side Authorization & Role Hardening:**
   - `/api/v1/auth/users` registered with owner protection (`require_owner`) for user creation and toggle.
   - `GET /api/v1/production-tickets` automatically enforces `assignee_id` filter for `karigar` role users.
   - Added `/accept`, `/reject`, `/start-work`, `/complete-work`, and `/ping` endpoints to `app/production/router.py`.

3. **End-to-End Workflow Verification:**
   - **Owner Login:** Logged in as `owner` → generated JWT token with owner role.
   - **Ticket Creation:** Created production ticket `PT-2026-XXXXXXXX` (Title: Test Production Gold Necklace, Category: Necklace). Initial status: `Draft`.
   - **Assignment:** Owner assigned ticket to `karigar1` ID → status auto-transitioned `Draft` → `Review` → `Assigned`.
   - **Karigar Isolation:** Logged in as `karigar1` → `GET /api/v1/production-tickets` returns only assigned ticket.
   - **Karigar Actions:**
     - `POST /accept` → ticket status moved to `Accepted`. `accepted_at` timestamp & timeline recorded.
     - `POST /start-work` → ticket status moved to `Production`.
     - `POST /complete-work` (with note: 'Finished gold polishing and stone fitting') → ticket status moved to `Quality Check`.
   - **Audit Trail:** Verified 5+ timeline and audit history entries recorded author IDs, event types, and timestamps.
