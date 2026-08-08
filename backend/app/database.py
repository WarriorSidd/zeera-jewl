import os
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/zjewl_db')

# ── Async engine (used at runtime) ──────────────────────────────────────────

def _build_async_engine():
    url = DATABASE_URL
    kwargs: dict = {"future": True, "pool_pre_ping": True}

    # asyncpg does not accept sslmode= in the URL; extract it and pass ssl= instead
    if 'sslmode=require' in url:
        url = url.replace('?sslmode=require', '').replace('&sslmode=require', '')
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["connect_args"] = {"ssl": ctx}

    return create_async_engine(url, **kwargs)


engine = _build_async_engine()
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# ── Sync engine (used only for create_all in dev) ───────────────────────────

def _build_sync_engine():
    url = DATABASE_URL
    # Strip sslmode from URL and inject ssl_context for psycopg2
    if 'sslmode=require' in url:
        url = url.replace('?sslmode=require', '').replace('&sslmode=require', '')
    # Swap asyncpg driver → psycopg2 for the sync engine
    if url.startswith('postgresql+asyncpg'):
        url = url.replace('postgresql+asyncpg', 'postgresql+psycopg2')
    # psycopg2 supports sslmode as a connect_arg
    return create_engine(url, future=True, pool_pre_ping=True,
                         connect_args={"sslmode": "require"} if 'neon.tech' in url else {})


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
