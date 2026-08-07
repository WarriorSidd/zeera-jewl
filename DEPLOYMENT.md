# Deployment Guide

This project is best deployed as two pieces:

- Frontend: Next.js on Vercel free tier.
- Backend and database: either FastAPI plus PostgreSQL on your Hostinger Cloud server, or FastAPI on Render with Neon Postgres.

No extra paid service is required for the current code.

## Recommended Free/Staging Topology

- Vercel: `frontend`
- Render: `backend`
- Neon: PostgreSQL

### 1. Neon

1. Create a Neon project.
2. Copy the connection string from the Neon dashboard.
3. Use the regular connection string Neon provides, for example:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require&channel_binding=require
```

The backend normalizes this URL for SQLAlchemy async connections automatically.

### 2. Render

1. Create a new Render Web Service from this GitHub repo.
2. Use the included `render.yaml` blueprint, or configure manually:
   - Root directory: `backend`
   - Runtime: Python
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/api/v1/health`
3. Add environment variables:

```env
DATABASE_URL=<your Neon connection string>
SECRET_KEY=<long random secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
```

After deployment, Render will give you a backend URL like:

```text
https://zeera-jewl-api.onrender.com
```

To show backend deployments in GitHub's Deployments page, add these GitHub repository secrets:

```env
RENDER_DEPLOY_HOOK_URL=<Render deploy hook URL>
RENDER_SERVICE_URL=https://zeera-jewl-api.onrender.com
```

The `Render Backend Deployment` GitHub Actions workflow creates a GitHub deployment entry, triggers Render, waits for `/api/v1/health`, and then marks the deployment success or failure.

### 3. Vercel

1. Import the GitHub repo in Vercel.
2. Set root directory to `frontend`.
3. Add:

```env
NEXT_PUBLIC_API_URL=https://zeera-jewl-api.onrender.com
```

Do not include `/api/v1` in `NEXT_PUBLIC_API_URL`.

## 1. Backend on Hostinger Cloud

1. Point a subdomain such as `api.your-domain.com` to the Hostinger server.
2. Install Docker and Docker Compose on the server.
3. Copy this repository to the server.
4. Create a production `.env` from `.env.example`.
5. Use these important backend values:

```env
DATABASE_URL=postgresql+asyncpg://postgres:strong-password@db:5432/mehul_db
SECRET_KEY=generate-a-long-random-secret
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong-password
POSTGRES_DB=mehul_db
```

6. Start the backend stack:

```bash
docker compose up -d --build db backend
```

7. Verify:

```bash
curl http://localhost:8000/api/v1/health
```

For HTTPS, put Nginx or Hostinger's reverse proxy in front of the backend and proxy `api.your-domain.com` to `http://127.0.0.1:8000`.

## 2. Frontend on Vercel

1. Import the Git repository in Vercel.
2. Set the Vercel project root directory to `frontend`.
3. Add this environment variable:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

4. Deploy.

The frontend code already calls paths like `/api/v1/production-tickets`, so `NEXT_PUBLIC_API_URL` must be only the backend origin, not a URL ending in `/api/v1`.

## 3. Current Production Notes

- The backend currently creates tables on startup with SQLAlchemy metadata. That is acceptable for the first deployment, but Alembic migrations should be used once schema changes become regular.
- Attachments currently store URLs only; file upload/object storage is not implemented yet.
- CORS is controlled by `FRONTEND_ORIGINS`. Add every deployed frontend domain there.
- Keep `mehul.db`, `.env`, and logs out of Git.
