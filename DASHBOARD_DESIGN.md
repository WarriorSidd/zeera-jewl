DASHBOARD DESIGN (PT-FOCUSED)
=============================

Purpose
-------
Design dashboards that surface Production Ticket (PT) insights. All widgets, alerts, and drill-downs must originate from PT data and link back to PT detail pages.

Design principles
-----------------
- PT-first: every dashboard widget drills down to a PT filtered list.
- Real-time where operationally necessary (Production Board), near-real-time for analytics.
- Role-specific but PT-centric: Owner, Production Manager, Karigar, QC, Accounts.

Dashboards
----------
1) Owner Dashboard
  - KPIs: PTs completed (MTD), PT gross margin (per PT), Overdue PTs, High-value delayed PTs
  - Live: PTs by stage
  - Alerts: PTs with > configured rework_count, PTs overdue > X days
  - Drilldowns: PT lists filtered by revenue, margin, or delay

2) Production Manager Dashboard
  - Live Kanban: PTs by stage with PT cards showing due date, assignees, priority
  - Bottleneck analysis: avg PT stage duration and slowest stages
  - Karigar load: PTs assigned per karigar and capacity indicators

3) Karigar Dashboard (mobile)
  - Assigned PTs (sorted by priority/due date), Pending Acceptance
  - Quick actions on PTs: Accept/Reject, Upload Progress Photo, Mark Stage Complete

4) QC Dashboard
  - PTs pending QC, Recent QC fails (with reasons), Rework queue
  - Defect distribution across PT categories

5) Accounts Dashboard (supporting)
  - PTs with invoices pending, PT-level AR summary, payments applied to PTs

Data & Queries
--------------
- All queries reference production_tickets and production_ticket_stages.
- Example: PTs by Stage: SELECT stage_name, COUNT(*) FROM production_ticket_stages WHERE start_time > now() - interval '30 days' GROUP BY stage_name;

Alerts & Notification Rules
--------------------------
- PT Assigned but not accepted within SLA -> reminder -> owner escalation.
- PT QC fail -> immediate notification to Production Manager and Owner if rework_count exceeds threshold.

Access & Security
-----------------
- Dashboards respect PT-level ACLs; sensitive financial widgets require finance_view permission.

Prepared by: Analytics Lead (PT-aligned)
Date: 2026-08-05
