BUSINESS ANALYSIS (PT-ALIGNED)
===============================

Note: This analysis is re-focused to treat Production Ticket (PT) as the central entity. All recommendations and missing items below reference PTs as the primary source of truth. Inventory, Accounts, and other modules are explicitly considered supporting systems for PT workflows.

Executive summary
-----------------
The Product Vision mandates a ticket-first platform. The current analysis shows missing workflows and modules required to operationalize PT-centric manufacturing at scale: better PT lifecycle controls, approval flows, PT-linked QC and rework, PT-bound notifications, PT-focused analytics, and stronger RBAC and audit requirements.

Key missing PT-centric items (high level)
----------------------------------------
- PT-level approval workflows (price changes, stage bypass, urgent finish).
- PT-linked material reservation and procurement support (supporting module).
- PT rework lifecycle and escalation rules recorded on PT timeline.
- PT-based reporting and KPIs (per-PT profit, PT cycle time, PT rework rates).
- Object-level ACLs and secure approvals for PT-sensitive actions.

Selected detailed gaps (aligned to PT)
--------------------------------------
- Missing PT acceptance & SLA rules: TTL, reminders, auto-reassignments and owner escalation.
- Missing PT evidence requirements: configurable per PT category or stage (e.g., mandatory photo at stage completion).
- Missing PT-level notifications and delivery receipts for external channels.
- Missing PT migration mapping from legacy system preserving history and attachments.

Recommendations (PT-first)
--------------------------
1. Make the Workflow Engine the authoritative gatekeeper for PT transitions; every transition must create a timeline event recorded in audit_logs.
2. Model Inventory, Procurement, and Accounts as supporting services whose APIs operate on PT events (e.g., reserve_materials(pt_id)).
3. Implement PT-level RBAC with approval workflows and mandatory justification for privileged transitions.
4. Create PT analytics materialized views (pt_stage_durations, pt_rework_counts) for dashboards.

Actionable next steps
---------------------
- Workshop to finalize evidence requirements per PT category and per stage.
- Define SLA values and escalation rules per PT priority.
- Design PT-first API endpoints and data migration mappings from JewelKAM to PTs.

Prepared by: Senior Business Analyst (aligned to Product Vision)
Date: 2026-08-05
