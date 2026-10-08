# Stays — short-stay booking marketplace

Full-stack assignment project: an Airbnb-style marketplace built with a Next.js + TypeScript
frontend, a FastAPI backend, and a SQLite database.

> Status: work in progress — **not assignment-complete**. Implemented: backend data model, seed
> data, read-only listing APIs, and the Explore page (search, categories, filters, pagination).
> Not yet implemented: listing detail, booking and checkout, My Trips, wishlist persistence,
> host dashboard and listing CRUD.

## Repository layout

```text
frontend/   Next.js (App Router) + TypeScript
backend/    FastAPI + SQLAlchemy, SQLite file in backend/data/
docs/       Planning notes and reference material
```

## Prerequisites

- Node.js 20.9+ and npm
- Python 3.11+

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # optional; defaults work locally
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/api/v1/health
- Interactive API docs: http://localhost:8000/docs
- On startup the API creates the SQLite file `backend/data/app.db` and its tables, and loads the
  seed data if the database is empty.

### Seed / reset the database

```bash
cd backend
source .venv/bin/activate
python -m app.seed            # seed only if empty
python -m app.seed --reset    # drop all tables, recreate, and reseed
```

Seed content is fixed; booking and review dates are relative to the day you seed. Listing photos
are hotlinked from Unsplash (Unsplash License); all names and text are fictional.

### API (so far)

All money values are integers in paise (INR minor units). Check-out dates are exclusive.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/listings` | Search/filter: `location`, `check_in`+`check_out`, `guests`, `min_price`, `max_price`, `property_type` (repeatable), `room_type`, `category`, `amenities` (repeatable codes, all required), `min_bedrooms`, `page`, `page_size` |
| GET | `/api/v1/listings/{id}` | Detail: images, amenities, host, rating summary, reviews |
| GET | `/api/v1/listings/{id}/availability?from=&to=` | Confirmed booked ranges in a window (default: next 365 days) |

Errors use `{"error": {"code", "message", "details"}}` with 404 / 422 status codes.

## Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local           # optional; defaults point to localhost:8000
npm run dev
```

Open http://localhost:3000 for the Explore page.

Checks: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Production server: `npm run build && npm start`.

## Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend/.env | `sqlite:///./data/app.db` | SQLite location (relative to `backend/`) |
| `CORS_ORIGINS` | backend/.env | `http://localhost:3000` | Comma-separated allowed origins |
| `TIMEZONE` | backend/.env | `Asia/Kolkata` | Defines "today" for past-date validation |
| `SERVICE_FEE_BPS` | backend/.env | `1200` | Mock service fee in basis points (12%) |
| `SEED_ON_STARTUP` | backend/.env | `true` | Seed an empty database when the API starts |
| `NEXT_PUBLIC_API_BASE_URL` | frontend/.env.local | `http://localhost:8000/api/v1` | API base URL used by the frontend (inlined at build time) |

## Deployment

The two apps deploy independently from this monorepo. The backend must run as **one instance**
because SQLite lives on a single persistent disk.

### Backend — Render (root directory `backend/`)

`render.yaml` is a Render Blueprint describing the service:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/v1/health` (runs `SELECT 1` against the database) |
| Instance | `0.5c-512mb` (paid; the free plan cannot attach a disk), 1 instance |
| Persistent disk | mounted at `/var/data` |
| `DATABASE_URL` | `sqlite:////var/data/app.db` |
| `CORS_ORIGINS` | the Vercel production origin, e.g. `https://<project>.vercel.app` |
| `PYTHON_VERSION` | `3.14.3` |

On first start the API creates the tables and seeds the empty database. Later restarts and
deploys keep existing data: seeding runs only when no listings exist.

### Frontend — Vercel (root directory `frontend/`)

Import the repository in Vercel with **Root Directory = `frontend`** (framework preset: Next.js)
and set `NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com/api/v1` for Production.
The value is baked in at build time, so redeploy after changing it.

### Order

1. Deploy the backend and note its URL; confirm `/api/v1/health` returns `{"status":"ok","database":"ok"}`.
2. Deploy the frontend with `NEXT_PUBLIC_API_BASE_URL` pointing at the backend.
3. Set the backend's `CORS_ORIGINS` to the frontend's production origin and redeploy the backend.
