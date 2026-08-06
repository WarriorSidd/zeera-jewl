UI / UX GUIDELINES (PT-FIRST)
=============================

Conformance: UI/UX strictly centers Production Ticket (PT). All screens, navigation, and interactions must make the PT the primary navigation and data anchor.

Design Principles
-----------------
- Production-first: every screen must allow quick access to PTs; PT detail is the primary workspace.
- Minimalist and fast: feel like Jira/Linear/Notion — minimal chrome, keyboard shortcuts, and power-user flows.
- Mobile-first for karigars: quick accept/reject, camera-first for progress photos, offline sync.
- Accessibility and responsive design across desktop and mobile.

Primary Screens
---------------
1) Global header & quick-create: quick-create PT button prominent; search box for PT number/fields.
2) PT List (Primary listing): filterable by PT number, status, assignee, category, due date, city, purity, etc.
3) PT Detail (central workspace): header with PT number, status, assignees, due date; main tabs: Overview, Stages, Timeline, Attachments, QC, Invoices, Audit.
4) PT Timeline: chronological feed of events (assign, accept, photo upload, QC result, invoice) with filters.
5) Assignment Console: choose karigars with skill match and capacity; assign with acceptance SLA and notify.
6) Kanban/Production Board: stage columns with PT cards showing progress and quick-actions (accept, add photo, move stage).
7) Role Dashboards: ticket-centric widgets (Owner, PM, Karigar, QC, Accounts).

Key UX Patterns
---------------
- PT as URL: every PT has canonical URL (e.g., /pt/PT-2026-000145) for sharing inside the app.
- Inline actions: accept/reject, upload photo, change stage executed inline on PT cards or detail.
- Fast search: global search for PTs by number, customer, karigar, category, file contents (attachments metadata).
- Timeline-first: activities and attachments are primary; conversation stored inside PT (not external chat).

Mobile Karigar App
------------------
- Home: assigned PTs, pending acceptance, due today.
- PT card: minimal details, accept/reject, camera upload bound to current stage.
- Offline Queue: store actions locally; sync with server; UI shows sync status and conflicts.

Notifications UX
----------------
- In-app notifications with PT links; notifications center shows unread and delivery status.
- External channels (WhatsApp/SMS) only as integration hooks; primary record remains in PT.

Forms & Validation
------------------
- Guided PT creation: stepper with minimal required fields, category-driven conditional fields.
- Autosave drafts; allow attachment uploads during drafting.

Search & Filtering
------------------
- Search bar supports PT-number exact match and rich filters for attributes (city, purity, diamond, karigar, status).

Component Library & Tokens
---------------------------
- Standardized components for PT cards, stage badges, timeline events, attachment previews, modals, and toasts.

Prepared by: UX Lead (aligned to Product Vision)
Date: 2026-08-05
