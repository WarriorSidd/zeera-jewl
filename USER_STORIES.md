USER STORIES (PT-CENTRIC)
==========================

Overview
--------
All user stories reference the Production Ticket (PT) as the central artifact. Stories are prioritized for MVP and future phases.

MVP (high priority)
-------------------
1. As Office Staff, I want to create a Production Ticket so that the customer's manufacturing job is recorded and actionable. 
   - AC: PT saved with unique PT-number; required fields validated; attachments accepted; PT timeline entry created.

2. As Production Manager, I want to assign karigars to a PT so that work can be executed.
   - AC: Assignment persisted on PT; assignees notified; acceptance SLA started.

3. As a Karigar, I want to accept or reject a PT assignment on mobile so that my availability is recorded.
   - AC: Acceptance/rejection recorded on PT timeline with timestamp and optional reason.

4. As QC Inspector, I want to record pass/fail and checklist on a PT so that quality is traceable.
   - AC: QC record attached to PT; photos stored; rework created on PT if fail.

5. As Accounts, I want to create invoices linked to a PT so that billing maps to work performed.
   - AC: Invoice linked to PT; tax and totals calculated; PT reflects billing status.

6. As Owner, I want a dashboard of PTs (overdue/high-value) so that I can act on priority risks.
   - AC: Dashboard items drill to PT lists and PT details.

Phase 2 (Should-have)
---------------------
- As Production Manager, I want PT-level material reservations so materials are not double-booked.
- As Karigar, I want offline support to accept PTs and upload photos when offline.
- As Accounts, I want PT-linked bank statement reconciliation.

Future (Nice-to-have)
---------------------
- AI-assisted karigar suggestions for PTs (postponed until architecture supports AI).
- Similar-PT search to find reference jobs.

Prepared by: Product Owner (PT-first)
Date: 2026-08-05