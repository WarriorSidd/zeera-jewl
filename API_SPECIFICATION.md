API SPECIFICATION (PT-FIRST)
============================

Purpose
-------
Define the REST API surface for a PT-centric backend. All endpoints favor Production Ticket as the central resource.

Auth
----
- POST /api/v1/auth/login -> {access_token, refresh_token}
- POST /api/v1/auth/refresh -> {access_token}

Production Tickets (primary)
----------------------------
- GET /api/v1/production-tickets -> list (filters: pt_number, status, assignee, category, due_date)
- POST /api/v1/production-tickets -> create PT (idempotency-key supported)
- GET /api/v1/production-tickets/:id -> PT detail (includes timeline, attachments, stages)
- PATCH /api/v1/production-tickets/:id -> update PT metadata (workflow engine governs status changes)
- POST /api/v1/production-tickets/:id/assign -> assign karigars (starts acceptance SLA)
- POST /api/v1/production-tickets/:id/accept -> karigar accepts assignment
- POST /api/v1/production-tickets/:id/stages/:stage_name/complete -> mark stage complete (evidence attached)

Attachments & Documents
-----------------------
- POST /api/v1/production-tickets/:id/attachments -> upload metadata; returns upload URL
- GET /api/v1/attachments/:id -> metadata & download URL

Karigars
--------
- GET /api/v1/karigars -> list (filter by skill, city)
- GET /api/v1/karigars/:id -> profile and capacity
- POST /api/v1/karigars/:id/availability -> set availability (used for assignment suggestions)

Notifications
-------------
- GET /api/v1/notifications -> list for user
- POST /api/v1/notifications/send -> internal (PT events) with template_id and pt_id

Invoices & Payments (supporting PT)
-----------------------------------
- POST /api/v1/production-tickets/:id/invoices -> create invoice for PT
- GET /api/v1/invoices/:id
- POST /api/v1/invoices/:id/payments -> record payment against PT invoice

QC
--
- POST /api/v1/production-tickets/:id/qc -> submit QC check (checklist, photos)

Integrations & Webhooks
-----------------------
- POST /api/v1/webhooks/integrations/whatsapp -> delivery receipts (should be linked to pt_id)
- POST /api/v1/webhooks/integrations/payment -> payment confirmations (link to invoice/PT)

Guidelines
----------
- All endpoints require Bearer token; PT-level ACLs enforced.
- Workflow engine governs state transitions; direct status updates are restricted.
- Responses use standard HTTP codes and structured error payloads {code, message, details}.
- Provide OpenAPI spec and generated SDKs for frontends.

Prepared by: API Architect (PT-first)
Date: 2026-08-05