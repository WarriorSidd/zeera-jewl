import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

from app.core.security import verify_password

url = os.getenv('DATABASE_URL', '').replace('postgresql+asyncpg://', 'postgresql://').replace('?sslmode=require', '')

async def check():
    conn = await asyncpg.connect(url, ssl=True)
    row = await conn.fetchrow("SELECT username, hashed_password FROM users WHERE username = 'owner'")
    if row:
        ok = verify_password('Owner1234', row['hashed_password'])
        print(f"Owner password 'Owner1234' match: {ok}")
    
    row1 = await conn.fetchrow("SELECT username, hashed_password FROM users WHERE username = 'karigar1'")
    if row1:
        ok1 = verify_password('Karigar1234', row1['hashed_password'])
        print(f"Karigar1 password 'Karigar1234' match: {ok1}")

    await conn.close()

if __name__ == '__main__':
    asyncio.run(check())
