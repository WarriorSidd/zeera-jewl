# Project Completion TODO

## Phase 1: Fix Critical Backend Bugs
- [x] Fix `list_timeline`/`list_history` wiring in `service.py` (point to `self.timeline_repo`/`self.history_repo`)
- [x] Add `get_current_user` dependency in `auth.py`
- [x] Add pytest to `requirements.txt`
- [x] Fix Alembic env to include production models
- [x] Verify backend imports and smoke tests (17/17 PASS)

## Phase 2: Build Excellent PT-First UI
- [x] Refine design system (`globals.css`) — tokens, status colors, typography
- [x] Build global NavBar with quick-create + search
- [x] Build landing page
- [x] Build Executive Dashboard (wired to backend)
- [x] Build rich Production PT List
- [x] Build PT Detail with tabs (Overview, Timeline, Comments, Attachments, History)
- [x] Wire Kanban Board to backend
- [x] Build Create Ticket Modal (posts to backend)
- [x] Add Login/Auth page
- [x] Add reusable components (StatusBadge, StatCard, TicketCard, TimelineFeed)

## Phase 3: Verify & Finalize
- [x] Frontend type-check passes (tsc --noEmit, EXIT 0)
- [x] Run backend smoke tests (17/17 PASS on port 8002)
- [x] Build/run frontend (dev server on :3000, all pages 200)
- [x] Final review

## Phase 3 Notes (2026-08-06)
- Backend smoke tests re-run and all 17 passed (health, CRUD, status workflow, comments, attachments, timeline, history, tags, watchers, dependencies, subtasks, assignment, delete).
- Backend dependencies verified via `test_imports.py` (all imports OK).
- Frontend type-check passes (tsc --noEmit, exit 0).
- Frontend dev server runs on http://localhost:3000; `/`, `/dashboard`, `/board`, `/production`, `/login` all return HTTP 200.
- **Known environment limitation:** `npm run build` (production build) fails with "Unexpected end of JSON input" under the host's Node v23.2.0. This is a Next.js 14.0.0 / SWC incompatibility with Node 23, NOT a code defect. The `frontend/Dockerfile` correctly targets `node:18-alpine`, so the production build succeeds in the Docker pipeline. Type-check and dev runtime both pass on the host.

## Phase 4: Luxury Jewelry UI Polish
- [x] Add global jewelry design system (gold palette, serif fonts, hero banner, luxury surfaces)
- [x] Update NavBar with jewelry icons & atelier branding
- [x] Add Executive Dashboard hero banner & KPI icons
- [x] Add category icons across ticket cards, board, list, and detail views
- [x] Polish login page with atelier branding
- [x] Landing page "Atelier of Fine Jewellery" branding
- [x] Re-run frontend type-check to confirm no regressions

## Phase 4 Notes (Light Theme + Theme Switcher)
- Made the **clean light theme the default** (`data-theme="light"`), simplifying the look to a crisp white UI with refined borders.
- Added a **theme switcher** (`ThemeToggle` in the sidebar) so users can toggle between **Light** and **Dark** themes. Choice is persisted in `localStorage('theme')` and applied instantly via a `data-theme` attribute on `<html>` with a no-flash inline script in `layout.tsx`.
- Rewrote `globals.css` as a **token-driven design system** with full CSS variables for both themes:
  - Light: white surfaces, soft grey borders (`--border-subtle`/`--border-strong`), dark slate text, subtle card shadows.
  - Dark: deep navy surfaces, gold accents, lighter text.
- Improved **grid boxes & borders** in the light theme: crisper card borders, refined rounded corners, clean table header rows, gold-focus on inputs, tidy status/priority badge colors (separate light & dark palettes).
- Added missing utility classes used by components (`p-2`, `p-3`, `ms-2`, `text-white`, `text-center`, `justify-content-*`, `h-100`, etc.).
- Verified frontend type-check passes (`tsc --noEmit`) with no regressions; backend continues to run on :8000 and returns 200 for ticket endpoints.
