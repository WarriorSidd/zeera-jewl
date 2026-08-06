NON-FUNCTIONAL REQUIREMENTS (PT-FIRST)
======================================

Purpose
-------
Non-functional requirements tuned for a PT-centric platform. NFRs here support the Production Ticket workload and ensure system availability, security, and maintainability without changing the product vision.

Performance
-----------
- Baseline: support 200 PT creations per day with spikes up to 2x.
- PT list endpoint (50 PTs/page) should respond <2s under baseline conditions.
- Live Production Board should update within <5s for PT events (near realtime).

Scalability
-----------
- Begin as a modular monolith; design modules so Workflow Engine and PT Service can be extracted if needed.
- Offload heavy processing (attachments, CAD previews, analytics) to background workers.

Availability
------------
- Target 99.5% availability during business hours.
- RPO: 24 hours default; RTO: 4 hours for core PT services (configurable by Owner).

Security
--------
- TLS everywhere; strong password hashing (Argon2/Bcrypt).
- Encrypt PT-sensitive fields and attachments at rest as required by law.
- 2FA (TOTP) for Admin/Finance users.
- PT-level ACL and audit logging for privileged actions.

Data Retention & Compliance
---------------------------
- Financial data: default 7 years retention.
- PT attachments: default 1 year active, archive thereafter.
- Provide tools for data export and legal holds on PTs.

Monitoring & Observability
--------------------------
- Metrics: PT creation rate, PT stage durations, worker queue lengths.
- Alerts: PT SLA breaches, failed backups, integration errors.
- Centralized logs with retention policy.

Backup & Restore
----------------
- Daily DB backups; WAL archiving; weekly restore drills to staging.
- Attachment backups via object store snapshots.

Maintainability
---------------
- Modular code organization; automated tests for PT lifecycle.
- Infra-as-code and documented runbooks for restore and incident handling.

Prepared by: Ops Lead (PT-first)
Date: 2026-08-05