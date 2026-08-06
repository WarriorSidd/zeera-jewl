zjewl Project - Jewelry Manufacturing Workflow Platform (Phase 1)
=================================================================

This repository contains the Phase 1 implementation scaffold: a monorepo with a Next.js frontend and a FastAPI backend. The system centers on the Production Ticket domain as defined in the project's Product Vision.

What's included
----------------
- backend/: FastAPI app (JWT auth, RBAC, SQLAlchemy models, Alembic scaffold)
- frontend/: Next.js minimal app
- docker-compose.yml: Postgres, backend, frontend, nginx
- nginx/: nginx.conf (reverse proxy)
- .env.example: environment variables
- .github/workflows/ci.yml: simple CI workflow

Development
-----------
1. Copy .env.example to .env and adjust values.
2. Start services:
   docker-compose up --build

Backend
-------
- FastAPI served at http://localhost:8000
- API root: /api/v1

Frontend
--------
- Next.js served at http://localhost:3000

Notes
-----
This Phase 1 scaffold uses sensible defaults and provides a working foundation for implementing the Production Ticket workflows. Follow the product documentation (frozen) for implementation details.

Prepared: 2026-08-05
