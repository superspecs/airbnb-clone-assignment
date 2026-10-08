# Improvement Log

Desktop-only review against the assignment PDF and public Airbnb. Each cycle lists the changes,
the checks actually run, and the outcome.

## Baseline (commit `aa26e3e`)

Checks run:
- `backend: .venv/bin/python -m pytest -q` → 23 passed
- `backend: python -m compileall -q app tests` → OK
- `frontend: npm run lint` → exit 0; `npx tsc --noEmit` → exit 0; `npm run build` → exit 0
- Local stack: API :8010 (scratch DB), web :3010; Chrome at 1280×800 and 1440×900
- Production (read-only): `/api/v1/health` ok; 32 listings, 18 seed bookings only

Deployment facts: Vercel project `stays-demo` (domain `stays-demo.vercel.app`, CLI deploys, not
Git-linked). Render service on the **Free plan, no persistent disk**; it auto-deploys on every push
to `main`, which recreates the SQLite database. To avoid any destructive production change, this
review keeps changes **frontend-only** and deploys them with the Vercel CLI without pushing.

Baseline scores (1–5):

| Criterion | Score | Evidence |
|---|---|---|
| Functionality | 4 | All core flows work locally and on prod; production data resets on Render Free restarts |
| UI/UX similarity | 3 | Airbnb layout patterns present; native date inputs, per-night card prices with dates, default 404, no sticky Reserve bar |
| Database design | 4 | Normalised tables, FKs, CHECKs, unique keys, price snapshot, overlap triggers; no migrations tool |
| Backend / API design | 4 | Feature modules (router/schemas/service), typed models, consistent errors, 23 tests; mock auth header |
| Code quality / modularity | 4 | Feature-grouped components and API clients; server actions for writes; lint/tsc clean |
| Ability to explain | 4 | README (architecture, schema, API, rules), docs, focused comments |

## Cycle 1 — search pickers and result cards (frontend only)

Changes:
- `components/ui/RangeCalendar.tsx` (+ CSS moved from `listing-detail/AvailabilityCalendar.module.css`):
  the two-month range picker extracted so search and the listing page share one implementation;
  `listing-detail/AvailabilityCalendar.tsx` is now a thin wrapper over it.
- `components/search/SearchBar.tsx` + CSS: "Check in"/"Check out" open an Airbnb-style calendar
  panel (past days disabled, range highlight, auto-advances to Who); "Who" panel with Adults
  (13+) and Children (2–12) steppers whose sum is the API `guests` filter. Native date inputs removed.
- `components/listing/ListingCard.tsx`, `ListingGrid.tsx`: heading "Villa in Assagao" / "Room in
  Anjuna", rating with count "★ 4.38 (8)", and with dates selected "₹43,500 for 3 nights"
  (display subtotal; the listing page's server quote adds fees).
- `components/explore/ExploreResults.tsx`: title-cased place in the heading; price note reflects
  nightly vs. stay-subtotal display.

Checks:
- `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run build` exit 0 (review build on :3010)
- Chrome 1440×900: When panel opens with Oct/Nov; picking 13→16 Nov advances to Who; 2 adults +
  1 child → URL `?location=goa&check_in=2026-11-13&check_out=2026-11-16&guests=3`; heading
  "2 stays in Goa · 13 Nov – 16 Nov · 3 guests"; first card "Villa in Assagao · ★ 4.38 (8) ·
  ₹43,500 for 3 nights".
- Chrome 1280×800: no horizontal scroll (`scrollWidth` 1280); guests panel within viewport.
- Regression: listing 1 calendar — booked night disabled, check-out on next arrival day enabled,
  crossing a booked night disabled, inline heading "2 nights in Candolim".

Observation: the test tab twice hard-navigated to `/` without scripted input; an idle 20 s run
with a click/unload logger recorded no navigation, so this is treated as outside interaction
with the visible test window, not an app defect.

Re-score: UI/UX 3 → 4 (search and card behaviour now match Airbnb's desktop patterns).

## Cycle 2 — error/404 states and detail-page booking bar (frontend only)

Changes:
- `app/not-found.tsx`, `app/error.tsx`, `app/status.module.css`: branded 404 ("We can't find that
  page" with Explore/Trips links) replacing the Next.js default; route error boundary with retry.
- `components/explore/StatusMessage.tsx`: `ResultsError` takes a page-specific title; listing,
  reservation, trips, wishlist, and host pages now say what failed.
- Host pages (`app/host/page.tsx`, `host/listings/new`, `host/listings/[id]/edit`): an API failure
  now shows an error instead of the misleading "Switch to a host account" gate.
- `components/listing-detail/StickyBookingBar.tsx` (+ CSS), `app/listings/[id]/page.tsx`,
  `BookingWidget.tsx`, `Sections.module.css`: after the gallery scrolls away a fixed bar shows
  Photos · Amenities · Reviews · Location; once the widget is out of view it adds price, nights
  selected, and Reserve (→ checkout) or Check availability. Anchors clear the bar.
- `components/listing-detail/Sections.tsx`: location line shows "Assagao, Goa, India" (was
  duplicating the city).

Checks:
- `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run build` exit 0
- Backend unchanged: `pytest -q` → 23 passed; `compileall` OK
- Chrome 1440×900, listing 2 with dates: bar absent at top; after gallery → section links; after
  widget → "₹14,500 night · 3 nights selected · ★ 4.38 · 8 reviews · Reserve" linking to
  `/listings/2/book?check_in=2026-11-13&check_out=2026-11-16&guests=2`.
- `/listings/9999` → branded 404.
- API stopped (scratch :8010 down): every page renders a specific error ("We couldn't load your
  trips", "…your hosting dashboard", "We can't book this stay", …); no 500s.
- Regression on scratch DB: booking listing 3 (1–4 Dec) → confirmation #19, appears in My Trips;
  overlapping POST → 409 `DATES_UNAVAILABLE`; host gate → Leela's dashboard (4 listings, 6 reservations).

Re-score: UI/UX 4 → 4 (closer, still no Explore map); Functionality 4 → 4 (prod persistence
unchanged); Code quality 4 → 4.

Stopping after two cycles: all required features are implemented and verified; remaining items
are mockable/optional (Explore map pins, review category scores, compact results header) or need
a paid plan (persistent production storage).

## Deployment and final verification

- Frontend only: Vercel preview `stays-demo-rf2tz2yvy-…` from a working-tree export (no `.env`,
  DB, PDF, or reference screenshots) → verified with `vercel curl` → promoted; production domain
  `stays-demo.vercel.app` unchanged. Not pushed to `main`, because a push redeploys the Render
  Free backend and recreates its database. Backend not redeployed; `/api/v1/health` ok.
- Production (read-only) Chrome checks: 1440×900 search via calendar/guests panels →
  "5 stays in Goa · 13 Nov – 16 Nov · 2 guests" with "for 3 nights" prices; 1280×800 listing 2:
  quote "₹50,720 for 3 nights", location "Assagao, Goa, India", sticky bar with Reserve →
  checkout URL; `/listings/9999` branded 404; console empty; all requests 200; Vercel logs: no
  error-level entries or 5xx in the last 20 minutes. No bookings/listings/wishlists written.

## Final scores (1–5)

| Criterion | Baseline | Final | Evidence |
|---|---|---|---|
| Functionality | 4 | 4 | Every required flow implemented and verified; production data still resets on Render Free |
| UI/UX similarity | 3 | 4 | Airbnb-style search panels, card format/stay prices, sticky Reserve bar, branded 404; no Explore map |
| Database design | 4 | 4 | Unchanged: normalised schema, constraints, triggers, price snapshot |
| Backend / API design | 4 | 4 | Unchanged; 23 tests pass |
| Code quality / modularity | 4 | 4 | Shared RangeCalendar replaces duplicated date UI; page-specific error states; lint/tsc clean |
| Ability to explain | 4 | 4 | README + gap analysis, UI review, and this log document decisions and evidence |
