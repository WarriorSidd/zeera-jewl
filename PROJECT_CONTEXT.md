PROJECT CONTEXT
===============

This file is refactored to conform to the PRODUCT VISION (the Constitution). Production Ticket is the central domain object. All content below strictly aligns with the Product Vision and objective.txt. If any prior document contradicts the Product Vision, the Product Vision rules.

Purpose
-------
Describe the business context and scope for the Jewelry Manufacturing Workflow Platform. The platform centralizes all manufacturing work in a single, auditable Production Ticket (PT) per job.

Central Tenet
-------------
Production Ticket (PT) is the single source of truth for every manufacturing job. Everything—workflows, dashboards, reports, attachments, approvals, QC results, invoices—must be attached to and navigable from the Production Ticket.

Primary Goals (product-vision aligned)
--------------------------------------
- Represent every manufacturing job as a Production Ticket with full lifecycle, timeline, attachments, and immutable audit.
- Replace scattered communication (WhatsApp/phone/excel) with structured, ticket-centric threads and attachments.
- Provide role-specific, ticket-focused dashboards and workflows (Owner, Production Manager, Karigar, Accounts, Admin).
- Keep Inventory and Accounts as supporting services for Production Tickets—not primary domains.
- Design the system with future AI extensibility, but do not implement AI now.

Scope & Constraints
-------------------
- Single-company, self-hosted on Hostinger.
- Avoid paid third-party infrastructure where feasible.
- Not a generic ERP; do not reframe architecture or UX away from Production Ticket as nucleus.

Key Stakeholders
----------------
- Owner: overarching oversight; uses PT-centric KPIs.
- Production Manager: schedules and monitors PTs and karigar allocations.
- Office Staff: creates and updates PTs with customer inputs.
- Karigars: receive PT assignments, accept/reject, upload progress into PTs.
- Accounts: create invoices and payments linked to PTs (supporting function).
- Admin/IT: system operations, RBAC, backups.
- QC: performs inspections recorded in PTs.

MVP Success Criteria (ticket-first)
-----------------------------------
- Create and manage Production Tickets through full lifecycle: Draft -> Review -> Assigned -> Accepted -> Production -> QC -> Ready -> Delivered -> Archived.
- All communication, attachments, and financial records are accessible via the Production Ticket.
- Immutable activity timeline for each Production Ticket.
- Role-based dashboards that surface PT-centric insights.

Open Items (to resolve with stakeholders)
-----------------------------------------
- Expected daily PT volume and concurrency for capacity planning.
- Retention policy for PTs and attachments.
- RTO/RPO targets for the client's business needs.

Prepared by: Chief Solution Architect (aligned to Product Vision)
Date: 2026-08-05
