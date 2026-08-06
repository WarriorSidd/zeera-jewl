import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./zjewl.db')

def make_sync_database_url(database_url: str) -> str:
    if database_url.startswith('sqlite+aiosqlite'):
        return database_url.replace('sqlite+aiosqlite', 'sqlite', 1)
    if database_url.startswith('postgresql+asyncpg'):
        return database_url.replace('postgresql+asyncpg', 'postgresql+psycopg2', 1)
    return database_url

engine = create_async_engine(DATABASE_URL, future=True, pool_pre_ping=True)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

from sqlalchemy import create_engine

sync_engine = create_engine(make_sync_database_url(DATABASE_URL), future=True, pool_pre_ping=True)

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

