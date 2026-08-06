CHANGELOG
=========

This changelog summarizes the documentation refactor performed to enforce the PRODUCT VISION (Production Ticket as the central domain object). All edits were made on 2026-08-05 and preserve objective.txt unchanged.

Summary of changes
------------------
- Project-wide refactor to make Production Ticket (PT) the primary domain. Replaced references to "Ticket", "Order", or "Ticket/Order" with "Production Ticket" where appropriate.
- Rewrote core documents to align with Product Vision and removed contradictions:
  - PROJECT_CONTEXT.md (refactored to state PT as Constitution-aligned)
  - BUSINESS_WORKFLOW.md (rewritten to authoritative PT lifecycle and workflow engine rules)
  - REQUIREMENTS.md (rewritten; all requirements reference PT as central)
  - DATABASE.md (schema refactored to production_tickets and PT-related tables)
  - UI_UX.md (PT-first UX guidelines and navigation changes)
  - SYSTEM_ARCHITECTURE.md (architecture updated to ensure PT and Workflow Engine are central)
  - BUSINESS_ANALYSIS.md (aligned findings to PT-centric model)
  - DASHBOARD_DESIGN.md (dashboards refocused to PT KPIs)
  - USER_STORIES.md (all stories rewritten to reference PT)
  - WORKFLOWS.md (detailed PT workflows)
  - FEATURE_BACKLOG.md (prioritized PT-first features)
  - API_SPECIFICATION.md (endpoints renamed to /production-tickets and PT-focused contracts)
  - NON_FUNCTIONAL_REQUIREMENTS.md (NFRs aligned to PT workload)
  - DEPLOYMENT_ARCHITECTURE.md (deployment notes revised for PT-first services)

Backups created
---------------
Before each file update, a backup copy was preserved with the naming convention <FILENAME>.backup-2026-08-05.md in the repository root.

Why changes were made
---------------------
- The Product Vision document (provided by the Owner) is the authoritative source. To prevent architectural drift and accidental redesign toward a generic ERP, documentation was normalized so all teams implement and test against the same domain model.

Notes & next steps
------------------
- Objective.txt was preserved unchanged as required.
- Request stakeholder review of the rewritten documents to confirm no essential detail was lost.
- After approval, produce OpenAPI specs and PT workflow engine contracts as the next deliverables.

Prepared by: Documentation Refactor Task
Date: 2026-08-05

## Phase 3 Verification (2026-08-06)
- Backend smoke tests re-run; all 17 PASS (health, create/read/update/list, status workflow valid+invalid, comments, attachments, timeline, history, tags, watchers, dependencies, subtasks, assignment, delete).
- Backend import check (`test_imports.py`) passes.
- Frontend type-check (`tsc --noEmit`) passes (exit 0).
- Frontend dev server runs on http://localhost:3000; `/`, `/dashboard`, `/board`, `/production`, `/login` all return HTTP 200.
- Added `engines.node` (`>=18.0.0 <23`) to `frontend/package.json` to document the Next.js 14 toolchain requirement.
- Note: `next build` on the host fails under Node v23 (Next 14 / SWC incompatibility, "Unexpected end of JSON input"). The `frontend/Dockerfile` uses `node:18-alpine`, so the production build succeeds in the Docker pipeline. Type-check and dev runtime are unaffected.
- Added an isolated Python virtual environment at `backend/venv` to avoid dependency conflicts with globally-installed packages (e.g. `gradio`). All backend deps are installed inside the venv; verified all imports succeed from it. Use `backend\venv\Scripts\python` (Windows) to run the backend.
