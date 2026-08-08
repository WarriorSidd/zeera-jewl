import os
import logging
import traceback
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import auth, models
from .database import sync_engine, Base

# Create DB tables safely (dev: create_all; prod: use alembic migrations)
try:
    Base.metadata.create_all(bind=sync_engine)
except Exception as e:
    print(f"[WARN] Could not run create_all on startup: {e}")

app = FastAPI(title="zjewl PT Backend", version="v1")


def get_allowed_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "*")
    if raw.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


# Ensure logs dir exists
try:
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'logs'), exist_ok=True)
except Exception:
    pass

# File logger for unhandled errors
try:
    logging.basicConfig(
        filename=os.path.join(os.path.dirname(__file__), '..', 'logs', 'app_errors.log'),
        level=logging.ERROR,
        format='%(asctime)s %(levelname)s %(message)s',
    )
except Exception:
    pass


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    tb = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logging.error(f"Unhandled exception for {request.method} {request.url}\n{tb}")
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'logs', 'last_error.txt'), 'a', encoding='utf-8') as f:
            f.write(f"{datetime.utcnow().isoformat()} {request.method} {request.url}\n{tb}\n---\n")
    except Exception:
        pass
    raise exc


allowed_origins = get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

# Production tickets
from .production import router as production_router
app.include_router(production_router, prefix="/api/v1/production-tickets", tags=["production_tickets"])


# ──── Utility endpoints ──────────────────────────────────────────────────────
@app.get('/api/v1/health')
async def health():
    return {"status": "ok"}


@app.get('/api/v1/')
async def root():
    return {"app": "zjewl PT Backend", "version": "v1"}
