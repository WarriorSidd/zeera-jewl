BUSINESS WORKFLOW
=================

Conformance note: This document is rewritten to follow the PRODUCT VISION. The central object is the Production Ticket (PT). Wherever prior docs used the term "Ticket" or "Order", the canonical term is Production Ticket.

Actors
------
- Customer (external)
- Office Staff
- Owner
- Production Manager
- Karigar (craftsman)
- Quality Control (QC) Inspector
- Accounts (supporting)
- Admin / IT

Production Ticket lifecycle (authoritative)
------------------------------------------
Draft
↓
Review
↓
Assigned
↓
Accepted
↓
Production Started
↓
Casting
↓
Stone Setting
↓
Polishing
↓
Quality Check
↓
Ready
↓
Delivered
↓
Closed
↓
Archived

Every state transition is recorded in the Production Ticket activity timeline. No action outside the system is authoritative; WhatsApp/phone are auxiliary.

Key Production Ticket workflows
-------------------------------
1) Create PT (Draft)
- Office Staff creates a Production Ticket with mandatory PT fields (customer, category, specs, expected delivery, attachments).
- PT number is generated (e.g., PT-2026-000145).

2) Review & Publish
- Production Manager reviews PT details, sets priority, and publishes to assign karigars.
- Publishing changes PT status from Draft to Assigned (once assignment is made).

3) Assign & Accept
- PM selects one or more karigars and schedules start.
- Assigned karigars receive PT notification and must Accept/Reject within configured SLA.
- Acceptance is an immutable record on PT.

4) Production Stages (enforced by workflow engine)
- Each PT progresses through configured stages (Casting, Setting, Polishing, etc.).
- Stage entry/exit events require evidence (photos/CAD/version) as configured.

5) QC & Rework
- QC results are recorded on the PT; Fail triggers Rework stage and records rework reason and counts.
- Rework loops remain attached to the same PT until QC passes or Owner escalates.

6) Delivery & Close
- After QC Pass and Ready, Accounts creates invoice linked to PT. Delivery evidence added to PT on completion; PT moves to Closed and then Archived per retention rules.

Cross-cutting rules
-------------------
- All communications, approvals, attachments, invoices, and QC are linked to the PT.
- Workflow engine enforces allowed transitions and permissions; no direct state jumps (e.g., Draft → Delivered) unless authorized via a logged approval.
- Immutable audit for every PT state change: who, when, old value, new value, IP, reason.

Notifications & SLAs
--------------------
- PT Assigned, Accepted/Rejected, DueSoon, Overdue, QC Failed, Delivery Completed are core notifications.
- SLA timers (acceptance, production lead time) are configured per PT priority and enforced by the workflow engine.

Exception handling
------------------
- If a karigar rejects, the PM reassigns; PT assignment history is preserved.
- If required materials are unavailable, PT status becomes On-Hold and a procurement action is created (supporting module).

Prepared by: Business Analyst (product-vision aligned)
Date: 2026-08-05
