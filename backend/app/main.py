import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import auth, models
from .database import sync_engine, Base

# Create DB metadata for development (migrations handled with alembic)
Base.metadata.create_all(bind=sync_engine)

import logging, traceback
from datetime import datetime

app = FastAPI(title="zjewl PT Backend")

# ensure logs dir
try:
    import os
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'logs'), exist_ok=True)
except Exception:
    pass

# configure simple file logger for exceptions
logging.basicConfig(filename=os.path.join(os.path.dirname(__file__), '..', 'logs', 'app_errors.log'), level=logging.ERROR, format='%(asctime)s %(levelname)s %(message)s')

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    tb = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    msg = f"Unhandled exception for {request.method} {request.url}\n{tb}"
    logging.error(msg)
    # also write a compact file for quick inspection
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'logs', 'last_error.txt'), 'a', encoding='utf-8') as f:
            f.write(f"{datetime.utcnow().isoformat()} {request.method} {request.url}\n{tb}\n---\n")
    except Exception:
        pass
    # Re-raise so FastAPI still returns 500
    raise exc

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

# Production tickets
from .production import router as production_router
app.include_router(production_router, prefix="/api/v1/production-tickets", tags=["production_tickets"])

@app.get('/api/v1/health')
async def health():
    return {"status": "ok"}

# Placeholder root
@app.get('/api/v1/')
async def root():
    return {"app": "zjewl PT Backend", "version": "v1"}
