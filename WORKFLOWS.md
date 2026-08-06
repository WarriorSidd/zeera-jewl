WORKFLOWS (PT-CENTRIC)
=======================

Purpose
-------
Define PT-centric workflows with explicit decision points, SLA timers, and exception handling. All workflows operate on Production Tickets as the central artifact.

End-to-End Production Ticket Workflow
------------------------------------
1. Customer places an inquiry/order (external).
2. Office Staff creates Production Ticket (Draft) attaching specs, images, CAD.
3. Production Manager reviews and publishes the PT (moves from Draft to Assigned when karigars are assigned).
4. Assigned karigars receive PT notifications; acceptance TTL starts.
5. Karigar accepts/rejects on mobile — acceptance recorded on PT timeline.
6. On acceptance, PT moves to Production Started; appropriate stage assigned.
7. Karigars upload progress (photos, notes) tied to PT stages.
8. QC performs inspection; Fail creates Rework event on same PT.
9. When QC passes, Accounts issues invoice linked to PT; delivery recorded; PT closed and later archived.

Rework Workflow (on PT)
------------------------
- QC Fail -> Rework event created on PT with rework_count increment.
- Rework assigned back to karigar(s) on PT; evidence stored on PT.
- If rework_count > threshold, Owner receives escalation notification.

Acceptance & Escalation
-----------------------
- Assignment triggers acceptance_timer.
- Reminder sent at reminder_threshold; if acceptance not received by reassignment_threshold, PM is notified and reassignment occurs.

Material Reservation (supporting)
---------------------------------
- At PT creation or stage requiring material, system requests reservation from Inventory Service.
- If unavailable, PT status -> On-Hold; procurement PO created (supporting action).
- Reservation releases when PT canceled or material consumed.

Price Change & Approvals
------------------------
- Price edits for a PT require authorize_by role if outside tolerance.
- Approval requests are linked to PT timeline with approver and reason.

Exception Handling
------------------
- Mobile sync conflicts surface as PT conflict items for manual reconciliation.
- Attachment upload failures retry with exponential backoff; failure recorded on PT timeline.

Prepared by: Process Architect (PT-aligned)
Date: 2026-08-05