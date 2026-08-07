import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import make_url
from dotenv import load_dotenv

load_dotenv()
RAW_DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./zjewl.db')

def make_async_database_url(database_url: str) -> str:
    url = make_url(database_url.replace('postgres://', 'postgresql://', 1))
    if url.drivername == 'sqlite':
        return str(url.set(drivername='sqlite+aiosqlite'))
    if url.drivername.startswith('postgresql'):
        query = dict(url.query)
        sslmode = query.pop('sslmode', None)
        query.pop('channel_binding', None)
        if sslmode:
            query['ssl'] = sslmode
        return str(url.set(drivername='postgresql+asyncpg', query=query))
    return str(url)

def make_sync_database_url(database_url: str) -> str:
    url = make_url(database_url.replace('postgres://', 'postgresql://', 1))
    if url.drivername.startswith('sqlite'):
        return str(url.set(drivername='sqlite'))
    if url.drivername.startswith('postgresql'):
        query = dict(url.query)
        ssl = query.pop('ssl', None)
        if ssl and 'sslmode' not in query:
            query['sslmode'] = ssl
        return str(url.set(drivername='postgresql+psycopg2', query=query))
    return str(url)

DATABASE_URL = make_async_database_url(RAW_DATABASE_URL)

engine = create_async_engine(DATABASE_URL, future=True, pool_pre_ping=True)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

from sqlalchemy import create_engine

sync_engine = create_engine(make_sync_database_url(RAW_DATABASE_URL), future=True, pool_pre_ping=True)

Base = declarative_base()

async def get_session() -> AsyncSession:
    try:
        async with async_session() as session:
            yield session
    except Exception as e:
        import traceback, os
        tb = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'logs'))
        os.makedirs(log_dir, exist_ok=True)
        with open(os.path.join(log_dir, 'get_session_error.txt'), 'a', encoding='utf-8') as f:
            f.write(tb + '\n---\n')
        raise

