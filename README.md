# Stays — short-stay booking marketplace

An Airbnb-style booking marketplace built for a full-stack assignment: a **Next.js + TypeScript**
frontend, a **FastAPI** backend, and a **SQLite** database accessed through **SQLAlchemy**.
Designed and verified for **desktop** viewports (1280–1440px wide).

- Live demo: https://stays-demo.vercel.app
- API: https://airbnb-clone-assignment-api.onrender.com (docs at `/docs`, health at `/api/v1/health`)

## Features

| Area | What works |
|---|---|
| Explore | Photo-card grid (carousel, rating, price/night, Superhost badge), search by location + dates + guests, category row, filters modal (type of place, price range, bedrooms, property type, amenities), numbered pagination, loading / empty / error states |
| Listing detail | Photo gallery + full photo tour, overview, host, description, amenities, two-month availability calendar (booked nights struck through), guest picker, server-computed price breakdown, reviews with rating distribution, map, host card |
| Booking | Date/guest validation, overlap prevention, demo "Confirm and pay" page (no card data), confirmation page, My Trips (upcoming / past / cancelled), cancellation before check-in |
| Host | Host dashboard with listings and reservations, create / edit / delete listings (photos by URL, amenities, pricing, capacity, location) |
| Account | Demo user switcher (5 hosts, 8 guests), persisted wishlists, toasts |
| Mocked | Payments, authentication, messaging ("Coming soon"), identity verification, photo upload (photos are https URLs), map (embedded OpenStreetMap) |

## Repository layout

```text
frontend/   Next.js 16 (App Router) + TypeScript, CSS Modules
backend/    FastAPI + SQLAlchemy 2 + SQLite; pytest suite in backend/tests
docs/       Planning notes, feature checklist, reference notes
render.yaml Render Blueprint for the backend
```

## Local setup

Prerequisites: Node.js 20.9+ and npm, Python 3.11+.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # optional; defaults work locally
uvicorn app.main:app --reload --port 8000
```

On startup the API creates `backend/data/app.db`, its tables and the booking-overlap triggers,
and loads seed data **only if the database has no listings**. Existing data is never
overwritten by startup.

Tests:

```bash
pip install -r requirements-dev.txt
python -m pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local           # optional; defaults point to http://localhost:8000/api/v1
npm run dev                          # http://localhost:3000
```

Checks: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Production server: `npm run build && npm start`.

### Seed / reset the local database

```bash
cd backend && source .venv/bin/activate
python -m app.seed            # seed only if empty
python -m app.seed --reset    # DESTRUCTIVE: drop all tables, recreate, reseed (local use only)
```

Seed content is fixed (5 hosts, 8 guests, 32 listings, 22 amenities, ~180 reviews, 18 bookings);
booking and review dates are offsets from the day you seed. Names and text are fictional.
Listing photos are hotlinked from Unsplash (Unsplash License).

### Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend | `sqlite:///./data/app.db` | SQLite file (relative to `backend/`; use 4 slashes for absolute paths) |
| `CORS_ORIGINS` | backend | `http://localhost:3000` | Comma-separated allowed origins |
| `TIMEZONE` | backend | `Asia/Kolkata` | Defines "today" for past-date validation |
| `SERVICE_FEE_BPS` | backend | `1200` | Mock service fee in basis points (12%) |
| `SEED_ON_STARTUP` | backend | `true` | Seed an empty database at startup |
| `NEXT_PUBLIC_API_BASE_URL` | frontend | `http://localhost:8000/api/v1` | API base URL (inlined at build time) |

## Architecture

```text
Browser ──> Next.js server (frontend/) ──HTTP JSON + X-Demo-User-Id──> FastAPI (backend/) ──> SQLite
            Server Components fetch data;               Feature modules: listings, bookings,
            Server Actions perform mutations             wishlists, host, users, meta
```

- **Frontend** (`frontend/src`): `app/` holds thin route files; `components/` is grouped by
  feature (`search`, `listing`, `listing-detail`, `trips`, `host`, `layout`, `ui`); `lib/api/*`
  is a typed API client per feature; `lib/types/*` mirror the backend schemas. Reads happen in
  Server Components inside `<Suspense>` (loading states stream in); writes go through Server
  Actions in `app/actions.ts`, so the browser never calls the API directly. Explore state lives
  in the URL. The demo user id is kept in a cookie and forwarded as `X-Demo-User-Id`.
- **Backend** (`backend/app`): each feature has `router.py` (thin), `schemas.py` (Pydantic
  request/response models) and `service.py` (rules). Shared ORM models live in `models/`.
  Errors always use `{"error": {"code", "message", "details"}}`.
- **Business rules are enforced on the backend**: price totals are computed server-side (a
  client-sent total is rejected), dates/guests/ownership are validated, and overlaps are
  prevented both by a `BEGIN IMMEDIATE` transaction and by SQLite triggers.

## Database schema (SQLite)

Money is stored as integer paise (INR minor units). Dates are ISO `YYYY-MM-DD`.

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, name, email (unique), avatar_url, bio, is_host, is_superhost, created_at | Hosts and guests |
| `listings` | id, host_id→users, title, description, property_type, room_type, category, address, city, state, country, latitude, longitude, nightly_price, cleaning_fee, max_guests, bedrooms, beds, bathrooms, created_at, updated_at, deleted_at | CHECK price > 0, guests ≥ 1; enum CHECKs; soft delete via `deleted_at` |
| `listing_images` | id, listing_id→listings (cascade), url, alt, position | UNIQUE(listing_id, position); position 0 = cover |
| `amenities` | id, code (unique), name, icon | |
| `listing_amenities` | listing_id, amenity_id | Composite PK (many-to-many) |
| `bookings` | id, listing_id→listings, guest_id→users, check_in, check_out, guests, status, nights, nightly_price, subtotal, cleaning_fee, service_fee, total, created_at | CHECK check_out > check_in; price snapshot; overlap triggers; index (listing_id, status, check_in, check_out) |
| `reviews` | id, listing_id, author_id, booking_id (unique, nullable), rating 1–5, comment, created_at | Ratings are aggregated in queries |
| `wishlists` | user_id, listing_id, created_at | Composite PK makes saving idempotent |

### Booking rules

- A stay is `[check_in, check_out)`: the check-out day is free for the next guest.
- Two confirmed stays overlap iff `a.check_in < b.check_out AND b.check_in < a.check_out`;
  overlapping requests get **409 `DATES_UNAVAILABLE`**. Cancelled bookings never block.
- Check-in can't be in the past (in `TIMEZONE`), stays are 1–90 nights, guests ≤ `max_guests`,
  and hosts can't book their own listings.
- Price = nightly price × nights + cleaning fee + 12% service fee (demo), computed by
  `app/bookings/pricing.py` for both the quote and the booking.
- Listings with upcoming confirmed bookings can't be deleted (409); deletion is a soft delete so
  guests keep their trip history.

## API overview (`/api/v1`)

Authenticated routes need the mock header `X-Demo-User-Id: <user id>` (401 without it).

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + database check |
| GET | `/listings` | Search: `location`, `check_in`+`check_out`, `guests`, `min_price`, `max_price` (paise), `property_type` (repeatable), `room_type`, `category`, `amenities` (repeatable), `min_bedrooms`, `page`, `page_size` |
| GET | `/listings/{id}` | Detail with images, amenities, host, rating summary, reviews |
| GET | `/listings/{id}/availability?from=&to=` | Confirmed booked ranges |
| GET | `/listings/{id}/quote?check_in=&check_out=&guests=` | Validated price breakdown (409 if taken) |
| POST | `/bookings` | Create booking `{listing_id, check_in, check_out, guests}` → 201 |
| GET | `/bookings/{id}` | Booking (guest or listing host only) |
| POST | `/bookings/{id}/cancel` | Guest cancels before check-in |
| GET | `/me`, `/me/trips` | Current demo user; their bookings |
| GET / PUT / DELETE | `/me/wishlist`, `/me/wishlist/{listing_id}` | Saved listings (idempotent) |
| GET / POST | `/host/listings` | Host's listings; create (201) |
| GET / PUT / DELETE | `/host/listings/{id}` | Read for editing, replace, soft delete (owner only) |
| GET | `/host/bookings` | Reservations on the host's listings |
| GET | `/users/demo`, `/meta/amenities` | Demo personas; amenity catalogue |

Example:

```bash
curl -X POST "$API/api/v1/bookings" -H "X-Demo-User-Id: 6" -H "Content-Type: application/json" \
  -d '{"listing_id": 2, "check_in": "2026-12-10", "check_out": "2026-12-13", "guests": 2}'
# 201 {"id": ..., "status": "confirmed", "price": {"nights": 3, "subtotal": 4350000, ..., "total": ...}, ...}
# 409 {"error": {"code": "DATES_UNAVAILABLE", "message": "Those dates are no longer available.", "details": null}}
```

## Assumptions and mocks

- **Auth is mocked**: pick any seeded user from the header menu (default: guest Priya Nair).
  No passwords, OTPs, or real sessions.
- **Payments are mocked**: checkout is labelled "Demo checkout — no payment is taken" and never
  asks for card details.
- **Messaging and identity verification** show "Coming soon".
- **Photos** are https URLs (no upload/cloud storage). **Map** is an embedded OpenStreetMap view.
- Currency is INR; the UI is designed for desktop widths only.

## Deployment

The two apps deploy independently from this repository.

### Backend — Render (`render.yaml`, root directory `backend/`)

| Setting | Value |
|---|---|
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/v1/health` |
| Instances | 1 (SQLite) |
| `CORS_ORIGINS` | `https://stays-demo.vercel.app` |
| `PYTHON_VERSION` | `3.14.3` |

Render builds only when files under `backend/` change (the service's `rootDir`), so
frontend or docs pushes never redeploy the API or reset its database.

**Current plan: Render Free — data is not persistent.** The free plan cannot attach a disk, so
`DATABASE_URL` points at the instance's ephemeral filesystem and the database is recreated from
seed data on every redeploy, restart, or wake-up (free services sleep after 15 idle minutes and
take ~1 minute to wake). Bookings and host edits therefore last only until the next restart.

To persist data (paid): set `plan: 0.5c-512mb`, add a disk mounted at `/var/data`, and set
`DATABASE_URL=sqlite:////var/data/app.db`. Keep one instance. No code changes are needed;
startup only creates missing tables/triggers and never reseeds a non-empty database.

### Frontend — Vercel (project `stays-demo`, root directory `frontend/`)

Production env: `NEXT_PUBLIC_API_BASE_URL=https://airbnb-clone-assignment-api.onrender.com/api/v1`
(baked in at build time). Once the GitHub repository is connected in Vercel (Settings → Git,
production branch `main`), every push to `main` redeploys the frontend; until then deploy with
`npx vercel deploy --prod` from a checkout linked to the `stays-demo` project.

### Keep-alive (free plan)

`.github/workflows/keep-backend-awake.yml` pings the health endpoint every 10 minutes when the
repository variable `BACKEND_HEALTH_URL` is set. GitHub disables scheduled workflows after 60
days without repository activity; re-enable it from the Actions tab if that happens.

## Known limitations

- Free-tier backend: non-persistent data and cold starts (see above).
- Desktop-only layout; phone-sized screens are out of scope.
- Search results are ordered by listing id (no ranking); no post-stay review submission yet.
- Wishlists are a single list per user (no named collections).
