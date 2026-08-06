SYSTEM ARCHITECTURE (PT-FIRST)
===============================

Conformance: Architecture is governed by the PRODUCT VISION. Production Ticket is the central domain; all modules exist to support PT workflows. This architecture intentionally avoids converting the system into a generic ERP.

Primary goals
-------------
- Make Production Ticket and Workflow Engine the heart of the system.
- Keep Inventory and Accounts supporting PT workflows, not dominating them.
- Modular monolith approach for MVP, with clear service boundaries enabling incremental extraction to microservices.

Logical components
------------------
- Clients: Web SPA (office) and Mobile (karigar). PT is the primary navigation element across clients.
- API Layer: API Gateway routes to backend services. All APIs are PT-first (e.g., /api/v1/production-tickets/...).
- Workflow Engine: enforces PT lifecycle, permissions, allowed transitions, approvals, and SLA timers.
- PT Service: authoritative CRUD and queries for Production Tickets and PT timeline.
- Supporting Services: Document Service, Notification Service, Karigar Service, QC Service, Accounts Service (invoicing), Inventory Service (material reservations).
- Audit Service: append-only logs for all PT events and critical field changes.
- Async & Workers: background tasks for attachments processing, PT analytics, notification dispatch, and integrations.
- Data Stores: Primary RDBMS (Postgres) for transactional PT data; Object Store (MinIO) for attachments; Message Broker (Redis/RabbitMQ) for async messages.

API & Service Contracts
-----------------------
- All external API surface is PT-first. Example: GET /api/v1/production-tickets, POST /api/v1/production-tickets/:id/assign
- Supporting APIs expose PT-linked operations only (e.g., POST /api/v1/production-tickets/:id/invoices).
- OpenAPI definitions required for all public integration points.

Workflow Engine responsibilities
-------------------------------
- Validate and enforce stage transitions for PTs.
- Record immutable acceptance/rejection events per PT.
- Trigger notifications, SLA timers, and escalation workflows tied to PTs.

Authentication & Authorization
------------------------------
- Central Auth service with RBAC and object-level ACLs for PTs.
- Admin approvals for exceptional PT transitions (e.g., bypassing stages) are logged and require justification.

Data architecture
-----------------
- Postgres schema centers on production_tickets, production_ticket_stages, production_ticket_timeline, attachments, invoices, payments.
- Materialized views for PT KPIs and dashboards.
- Audit logs written in same DB but append-only tables; consider write-ahead log replication for forensic exports.

Real-time & Notifications
-------------------------
- WebSocket channels scoped to PTs for real-time updates (e.g., /ws/pt/{pt_id}).
- Notification Service queues PT events and dispatches via preferred channels (in-app, WhatsApp/SMS hooks).

Deployment strategy
-------------------
- MVP: modular monolith deployment (Docker Compose) on Hostinger VM; single Postgres and MinIO instance.
- Ensure workflow engine and PT service run as core processes.
- Plan extraction of PT Service and Workflow Engine into separate services only if required by load.

Scaling & Resilience
--------------------
- Keep PT operations transactional and fast; offload heavy tasks (analytics, CAD previews) to workers.
- Use cached views for frequent PT queries on dashboards.

Security & Compliance
---------------------
- Encrypt sensitive PT-linked fields (e.g., bank details) at rest.
- All PT edits produce audit entries including actor, timestamp, old/new values, and reason.

Integration stance
------------------
- Integrations (WhatsApp, SMS, bank imports) are adapters that operate on PT events and create PT-linked records (messages, payment confirmations).

Prepared by: Chief Solution Architect (PT-first)
Date: 2026-08-05

