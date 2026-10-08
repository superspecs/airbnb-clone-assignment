# Architecture Plan

One application in one repository: a Next.js frontend and a FastAPI backend sharing a single
SQLite database owned by the backend. No microservices.

```text
Browser ──> Next.js (frontend/)  ──HTTP JSON──>  FastAPI (backend/)  ──SQLAlchemy──>  SQLite file
            UI, routing, display                 business rules, validation,         backend/data/app.db
            (never authoritative for             pricing, availability, persistence
             price or availability)
```

## Current foundation (implemented)

| Area | State |
|---|---|
| Frontend | Next.js 16.4, React 19.3, TypeScript (strict), App Router, `src/` layout, ESLint. Cache Components enabled by the generator (`next.config.ts`); request-time data must be read inside `<Suspense>`. No CSS framework yet. |
| Frontend files | `src/app/layout.tsx`, `src/app/page.tsx` (temporary API-status page), `src/lib/config.ts` (`NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:8000/api/v1`), `.env.example` |
| Backend | FastAPI 0.143, Uvicorn, SQLAlchemy 2.1, pydantic-settings; Python venv in `backend/.venv`; deps in `requirements.txt` |
| Backend files | `app/main.py` (app, CORS, `/api/v1` router), `app/core/config.py` (settings from env / `backend/.env`), `app/db.py` (engine, `SessionLocal`, `Base`, `get_db`) |
| Database | SQLite at `backend/data/app.db` (relative path resolved from `backend/`, directory auto-created); `PRAGMA foreign_keys=ON` on every connection; `check_same_thread=False` for FastAPI's thread pool |
| API | `GET /api/v1/health`; `GET /api/v1/listings` (search/filter), `GET /api/v1/listings/{id}` (detail), `GET /api/v1/listings/{id}/availability` |
| Data model (M2) | All tables below created via `create_all` at startup; deterministic seed loaded when empty; `python -m app.seed --reset` rebuilds |
| Verified | Frontend lint/build pass; health, `/docs`, CORS; seed counts, determinism, DB constraints, search filters, overlap edge cases, detail, availability, error responses |

## Module layout (feature-organised)

```text
backend/app/
  main.py              app, lifespan (create tables + seed if empty), CORS, error handlers, routers
  bootstrap.py         create_tables / reset_database / seed_if_empty           (exists)
  core/config.py       settings: DB, CORS, timezone, currency, service fee, seed flag (exists)
  core/errors.py       AppError → {"error": {"code", "message", "details"}}       (exists)
  core/dates.py        today() in the configured timezone                       (exists)
  db.py                engine/session/Base/get_db                                (exists)
  models/              shared ORM tables: user, listing(+image), amenity, booking, review, wishlist (exists)
  listings/            router.py (thin) · schemas.py · service.py — search, detail, availability (exists)
  bookings/            pricing.py (exists); router/schemas/service for booking creation + trips (M5)
  users/               demo identity: current_user, require_host (M5)
  wishlists/           router/schemas/service (M7)
  host/                host listing CRUD + host bookings (M6)
  seed/                data.py (fixtures) · loader.py · __main__.py (python -m app.seed [--reset]) (exists)
backend/tests/         booking/pricing rule tests (if approved)

frontend/src/
  app/                 routes only (thin): /, /listings/[id], /listings/[id]/book,
                       /trips, /trips/[bookingId], /wishlists, /host,
                       /host/listings/new, /host/listings/[id]/edit
  components/layout/   Header, SearchPill, UserMenu, Footer
  components/search/   SearchPanel (where/when/who), FilterChips, FiltersModal, Pagination
  components/listing/  ListingCard, ListingGrid, Gallery, PhotoTour, AmenityList, HostCard,
                       ReviewSummary, ReviewList, LocationMap (static)
  components/booking/  BookingWidget, RangeCalendar, GuestPicker, PriceBreakdown
  components/host/     ListingForm, HostListingTable, HostBookingTable
  components/ui/       Button, Modal, Toast, Skeleton, EmptyState, Stepper, Chip
  lib/api/             typed fetch client + error parsing (one module per feature)
  lib/types/           TypeScript types mirroring backend schemas
  lib/config.ts        (exists)
```

Rule: route files compose components and call `lib/api`; components never call `fetch` directly.
Backend routes stay thin; each feature's rules live in its own `service.py`.

## Feature areas and API boundaries

All routes under `/api/v1`. Errors use one shape with HTTP 400/403/404/409/422.

| Area | Endpoints | Notes |
|---|---|---|
| Meta | `GET /meta/amenities`, `GET /meta/property-types`, `GET /meta/categories` | Static seed-backed lists for filters/forms |
| Demo identity | `GET /users/demo`, `GET /me` | Header `X-Demo-User-Id` selects a seeded user |
| Search | `GET /listings?location&check_in&check_out&guests&min_price&max_price&property_type&amenities&category&page&page_size` → `{items, total, page, page_size}` | Date filter excludes listings with overlapping confirmed bookings |
| Listing detail | `GET /listings/{id}`, `GET /listings/{id}/reviews?page` | Includes images, amenities, host summary, rating aggregate |
| Availability | `GET /listings/{id}/availability?from&to` → `{blocked: [{check_in, check_out}]}` | Drives disabled calendar days |
| Pricing | `GET /listings/{id}/quote?check_in&check_out&guests` | Same function the booking uses |
| Bookings | `POST /bookings`, `GET /bookings/{id}`, `GET /me/trips?scope=upcoming\|past` | Client sends only listing, dates, guests |
| Wishlist | `GET /me/wishlist`, `PUT /me/wishlist/{listing_id}`, `DELETE /me/wishlist/{listing_id}` | Idempotent toggle |
| Host | `GET/POST /host/listings`, `PATCH/DELETE /host/listings/{id}`, `GET /host/bookings?listing_id` | Requires host role + ownership |

## Database schema (SQLite)

Money = integer minor units (paise, INR). Dates = ISO `YYYY-MM-DD` text. Timestamps = UTC ISO.

| Table | Columns | Constraints / indexes |
|---|---|---|
| `users` | id, name, email, avatar_url, bio, is_host, is_superhost, created_at | `email` UNIQUE |
| `listings` | id, host_id→users, title, description, property_type (`apartment`/`house`/`villa`/`cabin`/`cottage`), room_type (`entire_place`/`private_room`), category (`beachfront`/`amazing_pools`/`cabins`/`mountain_views`/`city_stays`/`countryside`/`lakefront`), address, city, state, country, latitude, longitude, nightly_price, cleaning_fee, max_guests, bedrooms, beds, bathrooms, created_at, updated_at, deleted_at | CHECK nightly_price > 0, cleaning_fee ≥ 0, max_guests ≥ 1, room counts; enum CHECKs; INDEX(city), INDEX(host_id) |
| `listing_images` | id, listing_id→listings (CASCADE), url, alt, position | UNIQUE(listing_id, position) |
| `amenities` | id, code, name, icon | `code` UNIQUE |
| `listing_amenities` | listing_id→listings (CASCADE), amenity_id→amenities | PK(listing_id, amenity_id) |
| `bookings` | id, listing_id→listings, guest_id→users, check_in, check_out, guests, nights, nightly_price, cleaning_fee, service_fee, subtotal, total, status (`confirmed`/`cancelled`), created_at | CHECK check_out > check_in, guests ≥ 1; INDEX(listing_id, status, check_in, check_out) |
| `reviews` | id, listing_id→listings, author_id→users, booking_id→bookings NULL, rating, comment, created_at | CHECK rating 1–5; UNIQUE(booking_id) |
| `wishlists` | user_id→users, listing_id→listings, created_at | PK(user_id, listing_id) |

Design notes: bookings snapshot prices so later listing edits don't change history; listing delete
is soft (`deleted_at`) and refused (409) while upcoming confirmed bookings exist; rating average
and count are computed in queries.

## Booking rules (backend-enforced)

- **Check-out is exclusive**: a stay `[check_in, check_out)` occupies nights `check_in … check_out−1`;
  a new guest may check in on another guest's check-out day.
- **Overlap**: `existing.check_in < new.check_out AND new.check_in < existing.check_out`, only for
  `status = 'confirmed'`.
- **Validation**: listing exists and not deleted; `check_out > check_in`; `check_in ≥ today` in the
  configured timezone; 1 ≤ nights ≤ 90; 1 ≤ guests ≤ `max_guests`; host cannot book own listing.
- **Concurrency**: `BEGIN IMMEDIATE` → overlap check → insert → commit, so SQLite's write lock
  serialises competing bookings.
- **Pricing** (single function for quote and booking): subtotal = nightly_price × nights;
  cleaning_fee from listing; service_fee = round(12% × subtotal), labelled "Service fee (demo)";
  total = sum. Client-submitted totals are never accepted.

## Authentication (mocked)

Seeded demo users with a visible "Switch user" control; selection stored in `localStorage` and
sent as `X-Demo-User-Id`. Backend resolves the user and enforces host role and ownership.
Documented as demo-only; no passwords stored.

## Seed data

Deterministic Python fixtures (`app/seed/data.py`, original fictional text): 5 hosts, 8 guests,
32 listings across Indian destinations, 22 amenities, 5 Unsplash-licensed photo URLs per listing,
181 reviews (fixed random seed), 18 bookings (13 upcoming incl. 1 cancelled, 5 past with linked
reviews). Booking/review dates are offsets from today. Listing 1 has back-to-back stays to
exercise the exclusive check-out rule. The API seeds an empty DB at startup
(`SEED_ON_STARTUP`); `python -m app.seed --reset` drops and rebuilds.

## Undecided choices

| Choice | Options | Recommendation |
|---|---|---|
| Styling | Tailwind CSS vs. CSS Modules + CSS custom properties | **CSS Modules + design tokens in `globals.css`.** The project has no CSS framework today, the reference notes are already expressed as tokens, and it adds no dependency. Revisit Tailwind only if styling velocity becomes the bottleneck. |
| Date-range picker | `react-day-picker` vs. custom component | **`react-day-picker`** when M4 starts: accessible, supports range selection and disabled-day matchers needed for booked/past dates, and is styleable to the two-month layout. A custom calendar is feasible but costs time better spent on the booking flow. |
| Toasts | Library vs. small custom component | Custom `ui/Toast` (few lines, no dependency). |
| Migrations | `Base.metadata.create_all` + reseed vs. Alembic | `create_all` + documented reset for this assignment; note Alembic as future work. |
| Branding | Airbnb-identical vs. original name/logo with Airbnb-like layout | Original name/logo ("Stays" is a placeholder), Airbnb-like layout and interactions. |
| Deployment | Vercel (frontend) + Railway/Render/Fly (backend with persistent volume) | Decide in M8; fall back to reseed-on-start if the host disk is ephemeral. |

## Implementation order

| # | Milestone | Exit check |
|---|---|---|
| M1 | Foundation (**done**) | Both apps run; health check passes |
| M2 | Schema, models, seed, demo identity, meta endpoints, API error format | Seeded DB; `/docs` shows contracts; booking-rule tests if approved |
| M3 | Explore + search + filters + pagination | Results match URL params; empty/loading states |
| M4 | Listing detail: gallery, info, amenities, reviews, static map, availability + quote | Booked dates disabled; breakdown from API |
| M5 | Booking flow + demo confirmation + My Trips | Booking survives reload; overlap → 409 shown as toast |
| M6 | Host dashboard + listing create/edit/delete | Changes persist; host sees bookings; ownership enforced |
| M7 | Wishlist, toasts, "Coming soon" placeholders, responsive polish, accessibility basics | Desktop + mobile browser pass |
| M8 | README, deployment, screenshots, handoff | Live URL verified end-to-end |
