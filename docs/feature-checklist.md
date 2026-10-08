# Feature Checklist

Source: `Assignment Airbnb Clone.pdf` (SDE Fullstack Assignment). Milestone numbers refer to
[architecture-plan.md](architecture-plan.md#implementation-order).

Legend: **[R]** required · **[B]** bonus (optional) · **[M]** may be mocked or shown as "Coming soon"

## 1. Home & search
- [ ] [R] Explore grid of listing cards: photo, title, location, price/night, rating (M3)
- [ ] [R] Search bar: location + date range + guests (M3)
- [ ] [R] Category / filter row: price range, property type, amenities (M3)
- [ ] [R] Pagination or infinite scroll (M3)

## 2. Listing detail
- [ ] [R] Photo gallery (M4)
- [ ] [R] Title, description, location, amenities, host info (M4)
- [ ] [R] Availability calendar / date-range picker (M4)
- [ ] [R] Price breakdown: nightly rate × nights + fees (M4)
- [ ] [R] Reviews section (M4)

## 3. Booking flow
- [ ] [R] Select date range and guest count with validation; no overlapping/unavailable dates (M5)
- [ ] [R] Booking summary and mocked checkout/confirmation (M5)
- [ ] [R] "My Trips" view of the user's bookings (M5)
- [ ] [R] Bookings persist and block those dates on the listing (M5)

## 4. Host experience (CRUD)
- [ ] [R] Create listing: title, description, photos (URL/upload), price, location, amenities (M6)
- [ ] [R] Edit and delete listings (M6)
- [ ] [R] Host dashboard: owned listings and their bookings (M6)
- [ ] [R] All listing data persists (M6)

## 5. Airbnb experience
- [ ] [R] Navigation and layout: explore grid + detail view (M3–M4)
- [ ] [R] Cards, galleries, date pickers, modals (M3–M5)
- [ ] [R] Search, filters, pagination (M3)
- [ ] [R] Notifications / toasts (M5–M7)
- [ ] [R] Wishlist / favorites — can be simple (M7)
- [ ] [R] Visual similarity to Airbnb's UI/UX (all UI milestones; see reference-notes.md)

## Mocked / placeholder sections
- [ ] [M] Payment processing — mocked checkout, clearly labelled demo; no card data collected (M5)
- [ ] [M] Guest ↔ host messaging — "Coming soon" (M7)
- [ ] [M] Real-time map with live pricing pins — static/basic map is acceptable (M4)
- [ ] [M] Identity verification — "Coming soon" (M7)
- [ ] [M] Authentication — simplified/mocked, but **guest vs host** must exist (M2)
- [ ] [M] Data, images, media, external services — placeholder/hardcoded allowed (M2)

## Bonus (only after required items work)
- [ ] [B] Interactive map with listing pins
- [ ] [B] Leave a review after a completed stay
- [ ] [B] Superhost badges / ratings aggregation
- [ ] [B] Image upload to cloud storage
- [ ] [B] Dark mode
- [ ] [B] Responsive design (mobile, tablet, desktop) — treated as required by project CLAUDE.md

## Data, documentation, delivery
- [ ] [R] Own SQLite schema with proper relationships — explicitly evaluated (M2)
- [ ] [R] Seed data: varied listings with photos, several hosts, existing bookings (M2)
- [ ] [R] README: setup, tech stack, architecture, database schema, API overview, assumptions (M8)
- [ ] [R] Public GitHub repository containing `frontend/` and `backend/` (M8)
- [ ] [R] Hosted, working demo link (M8)
- [ ] [R] Original work — no code copied from existing repositories (all milestones)

## Evaluation criteria (from the PDF)
Functionality (search, availability, booking) · UI/UX similarity · Database design ·
Backend/API design · Code quality · Code modularity · Ability to explain the code.
