REQUIREMENTS
============

This document is rewritten and constrained by the PRODUCT VISION (the Constitution). The Production Ticket (PT) is the central domain object. All requirements reference PT as the nucleus; Customers, Karigars, Inventory, and Accounts are supporting modules.

Scope
-----
- Build a Jewelry Manufacturing Workflow Platform centered on Production Tickets.
- Avoid designing a generic ERP. Inventory and Accounts are supportive and exist to enable PT workflows.

Terminology
-----------
- Production Ticket (PT): the canonical record for a single manufacturing job.
- PT Stage: a named step in PT lifecycle (Casting, Setting, Polishing, QC, etc.).
- Karigar: craftsman assigned to PT work.

MVP (Must-have)
----------------
1. Production Ticket lifecycle (authoritative): Draft -> Review -> Assigned -> Accepted -> Production -> QC -> Ready -> Delivered -> Closed -> Archived.
2. PT-centric data and attachments: all photos, CAD, invoices, and comments are attached to PTs.
3. RBAC focused on PT actions (create, assign, accept, change-stage, close). Roles: Owner, Admin, Production Manager, Office Staff, Karigar, QC, Accounts (supporting).
4. Immutable PT activity timeline and audit for every state change and critical field update.
5. PT Assignment and Acceptance flow with SLA timers and escalation rules enforced by the workflow engine.
6. Basic invoicing mechanism linked to PTs (Accounts supports PT billing; invoices are child records of PTs).
7. Notifications (in-app) for PT events and integration hooks for WhatsApp/SMS (future). 
8. Role-specific dashboards that surface PT KPIs and actionable lists.

Phase 2 (Should-have)
---------------------
- Material reservation tied to PTs (Inventory supports PTs but is not primary).
- Mobile/offline Karigar experience for accepting PTs and uploading progress.
- QC checklists and structured defect records on PTs.
- Advanced PT permission model (object-level ACLs)

Phase 3 (Nice-to-have)
-----------------------
- AI suggestions and search features that propose karigars or similar PTs.
- CAD viewer and advanced media handling within PTs.

Functional (detailed, PT-focused)
--------------------------------
1) PT fields and validation
  - Required fields: customer, category, expected_delivery_date, manufacturing_instructions, primary_assignee(optional until Assigned).
  - Conditional validations applied per category (e.g., diamond fields for diamond PTs).
2) Assignment rules
  - PM assigns karigars to PTs; acceptance is required and immutable with timestamp.
  - PT assignment history retained; reassignments create new events on PT timeline.
3) Stage transitions
  - Workflow engine enforces allowed transitions and required evidence (photos/CAD) where configured.
4) QC
  - QC results write structured records to PT; Fail triggers Rework stage on the same PT.
5) Billing
  - Invoices are generated against PTs. Payments are recorded and linked to PTs for AR reporting.
6) Attachments
  - All attachments are stored in Document Service and linked to PTs with metadata and versions.
7) Notifications
  - PT-level notification templates and delivery logs.

Non-functional (summary)
------------------------
- Performance, availability, backup, and security requirements are defined in NON_FUNCTIONAL_REQUIREMENTS.md and must support PT volume targets.

Data Migration
--------------
- Migration tools must map legacy orders to Production Tickets, preserving historical attachments and timelines.

Acceptance Criteria (examples)
------------------------------
- Create PT with attachments -> Assign karigar -> Karigar accepts -> Move through stages -> QC pass -> Invoice -> Payment -> Delivery recorded; All steps appear on PT timeline and audit.

Prepared by: Product Owner (aligned to Product Vision)
Date: 2026-08-05
