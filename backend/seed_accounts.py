"""
Seed script — creates the Owner and Karigar test accounts.
Uses asyncpg + raw bcrypt (bypasses passlib's version-detection bug).

Usage (from the backend directory, with venv activated):
    python seed_accounts.py

It is safe to run multiple times — it skips users that already exist.
"""
import asyncio
import os
import uuid

from dotenv import load_dotenv
load_dotenv()

import sys
sys.path.insert(0, os.path.dirname(__file__))

DATABASE_URL = os.getenv('DATABASE_URL', '')


def make_hash(password: str) -> str:
    """Hash using raw bcrypt, bypassing passlib's broken detect_wrap_bug."""
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def seed():
    try:
        import asyncpg
    except ImportError:
        print("[ERROR] asyncpg not installed.")
        return

    # Build connection URL
    url = DATABASE_URL
    ssl = False
    if 'sslmode=require' in url:
        url = url.replace('?sslmode=require', '').replace('&sslmode=require', '')
        ssl = True
    conn_url = url.replace('postgresql+asyncpg://', 'postgresql://')

    print(f"Connecting to DB…")
    conn = await asyncpg.connect(conn_url, ssl=ssl)

    SEED_USERS = [
        {"username": "owner",    "full_name": "Mehul (Owner)",  "password": "Owner1234",   "role": "owner"},
        {"username": "karigar1", "full_name": "Ramesh Karigar", "password": "Karigar1234", "role": "karigar"},
        {"username": "karigar2", "full_name": "Suresh Karigar", "password": "Karigar1234", "role": "karigar"},
    ]

    for data in SEED_USERS:
        existing = await conn.fetchrow("SELECT id FROM users WHERE username=$1", data["username"])
        if existing:
            print(f"  [SKIP] {data['username']} already exists (id={existing['id']})")
            continue
        uid = str(uuid.uuid4())
        hashed = make_hash(data["password"])
        await conn.execute(
            """
            INSERT INTO users (id, username, full_name, hashed_password, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
            """,
            uid, data["username"], data["full_name"], hashed, data["role"]
        )
        print(f"  [OK]   Created {data['role']:20s}: {data['username']:15s} / {data['password']}")

    await conn.close()


if __name__ == "__main__":
    print("=== zjewl Seed Accounts ===")
    asyncio.run(seed())
    print("=== Done ===")
    print()
    print("Test credentials:")
    print("  Owner:    owner    / Owner1234")
    print("  Karigar1: karigar1 / Karigar1234")
    print("  Karigar2: karigar2 / Karigar1234")
