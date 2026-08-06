DATABASE DESIGN (PT-CENTRIC)
=============================

Conformance: This schema centers Production Tickets (PT) as the primary entity. Inventory and Accounts entities exist to support PT workflows and are modelled as subordinate records.

Principles
---------
- Use PostgreSQL with UUID primary keys for public entities.
- Normalize core transactional data; use materialized views for PT analytics.
- Append-only audit_logs capture PT state transitions and critical field changes.
- Store large binary files (CAD, images) in object store (MinIO); DB stores metadata and references.

Core Entities
-------------
1) production_tickets
- id (uuid)
- ticket_number (string, unique, e.g., PT-2026-000145)
- customer_id (fk nullable)
- category (enum)
- description (text)
- status (enum) -- reflects PT lifecycle
- priority (enum)
- expected_delivery_date (date)
- created_by (fk users)
- created_at, updated_at

2) production_ticket_stages
- id (uuid)
- production_ticket_id (fk)
- stage_name (string)
- assigned_karigar_id (fk nullable)
- start_time (timestamp)
- end_time (timestamp)
- status
- evidence_required (jsonb) -- config per stage

3) production_ticket_timeline
- id (bigserial)
- production_ticket_id
- event_type (enum)
- actor_id (fk users)
- metadata (jsonb)
- created_at

4) users
- id (uuid)
- name, email, phone
- role_id (fk)
- is_active, created_at, updated_at

5) karigars
- id (uuid)
- user_id (fk)
- skills (jsonb or m2m to skill_tags)
- city, experience_years
- capacity_profile (jsonb)
- rating

6) attachments
- id (uuid)
- production_ticket_id (fk nullable)
- stage_id (fk nullable)
- uploader_id (fk)
- object_store_path
- mime_type, size_bytes, checksum
- version, created_at

7) invoices
- id (uuid)
- production_ticket_id (fk)
- invoice_number
- issue_date, due_date
- total_amount, tax_breakup (jsonb)
- status

8) payments
- id (uuid)
- invoice_id (fk)
- amount, method, reference, posted_at

9) material_reservations
- id (uuid)
- production_ticket_id (fk)
- item_id (fk)
- quantity_reserved
- reserved_at, reserved_by

10) inventory_items (supporting)
- id (uuid)
- sku, name, type (metal/stone/consumable)
- uom, quantity_on_hand, purity

11) qc_checks
- id (uuid)
- production_ticket_id
- stage_name
- inspector_id
- status, checklist_results (jsonb), notes, created_at

12) audit_logs (append-only)
- id (bigserial)
- object_type
- object_id
- action
- actor_id
- metadata (jsonb) -- includes old_value/new_value
- created_at

13) roles & permissions
- roles(id,name)
- permissions(id,name)
- role_permissions(role_id, permission_id)

Indexing & Views
----------------
- Index production_tickets(ticket_number), production_tickets(status, expected_delivery_date)
- Materialized view: pt_stage_durations (for KPIs)
- GIN indices for jsonb search fields

Transactions & Concurrency
--------------------------
- Use optimistic locking for PT updates; use SELECT FOR UPDATE for reservation flows.
- All critical writes producing state transitions append to production_ticket_timeline and audit_logs within the same DB transaction.

Data retention & backups
------------------------
- Financial records retained per compliance (default 7 years).
- PT attachments retention configurable; default 1 year archive.
- Daily DB backups + WAL; periodic restore rehearsals.

Prepared by: Data Architect (PT-centric)
Date: 2026-08-05
