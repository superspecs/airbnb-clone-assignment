# Assignment Gap Analysis

Source of requirements: `Assignment Airbnb Clone.pdf`. Scope: desktop only (1440×900, 1280×800).
Status: **Pass** = implemented and manually verified; **Partial** = works with a notable gap;
**Missing** = not implemented. Evidence = what was actually run or inspected.

## Baseline (review start, commit `aa26e3e`)

| # | Requirement | Status | Evidence / gap |
|---|---|---|---|
| 1.1 | Grid of cards: photo, title, location, price/night, rating | Pass | Local 3010 Explore: 24 cards/page, 4 columns at 1280 and 1440 |
| 1.2 | Search bar: location + date range + guests | Partial | Works and filters correctly, but dates use native browser date inputs and guests is a single counter — not the Airbnb calendar/guest panels |
| 1.3 | Category / filter row (price, type, amenities) | Pass | Category row + Filters modal (type of place, price, bedrooms, property type, amenities) |
| 1.4 | Pagination or infinite scroll | Pass | Numbered pagination, 24 per page (2 pages) |
| 2.1 | Photo gallery | Pass | 1+4 grid + full photo tour dialog |
| 2.2 | Title, description, location, amenities, host info | Pass | Detail sections render for every seeded listing |
| 2.3 | Availability calendar / date-range picker | Pass | Two-month calendar, booked nights struck through, exclusive check-out |
| 2.4 | Price breakdown (nightly × nights + fees) | Pass | Server quote: subtotal + cleaning + 12% demo service fee |
| 2.5 | Reviews section | Pass | Average, count, 5→1 distribution, review cards |
| 3.1 | Date range + guests with validation, no overlaps | Pass | 23 backend tests incl. overlap, concurrency, past dates, capacity; DB trigger |
| 3.2 | Booking summary + mocked checkout/confirmation | Pass | "Confirm and pay" demo page (no card fields) → confirmation page |
| 3.3 | My Trips | Pass | Upcoming / Past / Cancelled sections |
| 3.4 | Bookings persist and block dates | Partial | Persist in SQLite and block dates (verified locally and on prod); **production data resets** on Render Free restarts/redeploys (no disk) |
| 4.1 | Create listing (title, description, photos via URL/upload, price, location, amenities) | Pass | Form with photo URLs + previews; upload not implemented (URL satisfies "URL/upload") |
| 4.2 | Edit and delete listings | Pass | Edit prefilled; soft delete, refused with upcoming bookings |
| 4.3 | Host dashboard of listings and bookings | Pass | Listings table + reservations table |
| 4.4 | Listing data persists | Partial | Same production-persistence caveat as 3.4 |
| 5.1 | Navigation and layout (explore grid + detail) | Pass | Sticky header, user menu, category row |
| 5.2 | Cards, galleries, date pickers, modals | Partial | Search date picker is native inputs; detail page lacks Airbnb's sticky price/Reserve bar once the widget scrolls away |
| 5.3 | Search, filters, pagination | Pass | See 1.x |
| 5.4 | Notifications / toasts | Pass | Toasts for wishlist, booking, cancel, host CRUD, user switch |
| 5.5 | Wishlist / favorites | Pass | Persisted per demo user; Wishlists page |
| 5.6 | Loading / empty / error states | Partial | Present on Explore and pages; **no custom 404 or error boundary** (Next default 404 page) |
| M | Mocks: payment, messaging, map, ID verification, auth | Pass | Labelled demo checkout, "Coming soon" messaging, OSM embed, demo user switcher |
| D | Seeded data, README, public repo, hosted demo | Pass | 32 listings / 5 hosts / 18 bookings; README; GitHub public; Vercel + Render live |

## Prioritised gaps (baseline)

1. **Search date/guest pickers** use native inputs (largest visible difference from Airbnb's search).
2. **Card prices ignore chosen dates**: Airbnb shows "₹X for N nights" when dates are set; card
   title format differs ("Flat in Candolim", "★ 4.97 (34)").
3. **No custom 404 / error boundary** for missing listings or unexpected failures.
4. **Detail page**: no sticky price + Reserve bar after the widget scrolls out of view.
5. **Production persistence** (Render Free, no disk) — requires a paid plan; not fixable without approval.
6. Optional/mockable: Explore map with price pins, review category scores.

## Final status (after cycles 1–2)

| # | Requirement | Status | Change / evidence |
|---|---|---|---|
| 1.2 | Search bar: location + dates + guests | **Pass** | Calendar panel + Adults/Children panel (Cycle 1); verified 1440 and 1280 |
| 1.1 | Cards incl. price with dates | **Pass** | "Villa in Assagao · ★ 4.38 (8) · ₹43,500 for 3 nights" (Cycle 1) |
| 5.2 | Date pickers / detail booking UX | **Pass** | Shared RangeCalendar; sticky section + Reserve bar (Cycle 2) |
| 5.6 | Loading / empty / error states | **Pass** | Branded 404, route error boundary, page-specific API errors incl. API-down check (Cycle 2) |
| 3.4, 4.4 | Production persistence | **Partial** | Unchanged: Render Free has no disk; needs a paid plan (not changed without approval) |

All other rows remain **Pass** as in the baseline table. Optional/mockable items not built:
Explore map with price pins, review category scores, image upload to cloud storage.
