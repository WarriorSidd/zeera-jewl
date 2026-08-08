import os
import ssl
import re
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/zjewl_db')


def _sanitize_url_for_asyncpg(raw_url: str) -> tuple[str, bool]:
    is_ssl_required = 'neon.tech' in raw_url or 'sslmode=' in raw_url or 'ssl=' in raw_url
    url = raw_url

    # Ensure scheme uses +asyncpg driver
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite://"):
        url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)

    # Strip all query parameters from URL path so database name is clean (e.g. /neondb)
    url = re.sub(r'[\?&].*$', '', url)
    return url, is_ssl_required


def _sanitize_url_for_psycopg2(raw_url: str) -> str:
    url = raw_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    url = re.sub(r'[\?&].*$', '', url)
    return url


# ── Async engine (used at runtime) ──────────────────────────────────────────

def _build_async_engine():
    url, is_ssl_required = _sanitize_url_for_asyncpg(DATABASE_URL)
    kwargs: dict = {"future": True, "pool_pre_ping": True}

    if is_ssl_required:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["connect_args"] = {"ssl": ctx}

    return create_async_engine(url, **kwargs)


engine = _build_async_engine()
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# ── Sync engine (used only for create_all in dev) ───────────────────────────

def _build_sync_engine():
    url = _sanitize_url_for_psycopg2(DATABASE_URL)
    return create_engine(
        url,
        future=True,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"} if 'neon.tech' in DATABASE_URL or 'sslmode=' in DATABASE_URL else {},
    )


sync_engine = _build_sync_engine()

Base = declarative_base()


async def get_session() -> AsyncSession:
    try:
        async with async_session() as session:
            yield session
    except Exception as e:
        import traceback
        tb = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'logs'))
        os.makedirs(log_dir, exist_ok=True)
        with open(os.path.join(log_dir, 'get_session_error.txt'), 'a', encoding='utf-8') as f:
            f.write(tb + '\n---\n')
        raise
