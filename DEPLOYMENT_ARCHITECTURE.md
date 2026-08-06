DEPLOYMENT ARCHITECTURE (PT-FIRST)
==================================

Purpose
-------
Describe a Hostinger-focused deployment optimized for a Production Ticket-centered application. The deployment emphasizes reliability for PT workflows and ease of operations for a single-tenant environment.

MVP topology (single VM)
------------------------
- Hostinger VPS (recommended specs: 4 vCPU, 8–16GB RAM, SSD storage) depending on PT volume.
- Containerized components (Docker Compose):
  - Nginx (reverse proxy + TLS)
  - App (modular monolith emphasizing PT & Workflow Engine)
  - PostgreSQL (local or managed if permitted)
  - MinIO (object store for PT attachments)
  - Redis (cache & pub/sub)
  - Worker pool (background tasks)
  - Monitoring agent + Grafana

Resilience & Backups
--------------------
- Daily DB dumps + WAL archiving to offsite encrypted storage.
- MinIO snapshots and lifecycle rules for PT attachments.
- Weekly restore drills to staging to validate backups.

Networking & Security
---------------------
- TLS via Let’s Encrypt.
- Firewall rules restrict ports; SSH access via keys.
- Secrets stored securely and rotated periodically.

Operational practices
---------------------
- Use migration tooling for DB schema changes (e.g., alembic).
- CI pipeline produces artifacts; deployments via controlled SSH or self-hosted runners.
- Centralized logs and basic alerting for PT SLA breaches and failed workers.

Scaling Roadmap (PT-focused)
----------------------------
1. Increase VM resources.
2. Move Postgres to a dedicated host; add read replica for reporting.
3. Split Workflow Engine and PT Service into separate processes/services if CPU-bound.
4. Add multiple app instances behind a load balancer; ensure session statelessness.
5. Consider Kubernetes if multi-node orchestration is needed.

Security & Compliance
---------------------
- Principle of least privilege for service accounts.
- Encrypted backups and access control for PT attachments.

Prepared by: Infrastructure Architect (PT-first)
Date: 2026-08-05