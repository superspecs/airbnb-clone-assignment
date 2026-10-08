# Airbnb Assignment Project Instructions

Use this file as project-level guidance for Claude Code. It applies from initial repository inspection through deployment and handoff.

## Project goal

Build an original Airbnb-style booking marketplace for the provided full-stack assignment. The product should feel like a polished short-stay marketplace and support the required guest and host workflows.

## Assignment constraints

- Frontend: Next.js with TypeScript.
- Backend: Python with FastAPI or Django. Prefer FastAPI unless the existing project already has a clear Django setup.
- Database: SQLite with a designed, documented schema.
- Required features: explore/search, listing detail, availability, booking, My Trips, host listing CRUD, seeded data, responsive marketplace UI.
- Payment processing may be mocked. Data, images, media, and external services may be mocked. A static/basic map is sufficient. Authentication may be simplified, but guest and host roles should be represented.
- Required handoff: public GitHub repository with `frontend/` and `backend/`, README covering setup, architecture, schema, API, assumptions; and a hosted working demo.
- Estimated assignment effort is approximately 24 hours. Prioritize a complete core workflow, deployment, and documentation over optional features.

## Integrity and reference repository policy

Reference GitHub repository URL: **[PASTE REFERENCE REPOSITORY URL HERE]**

Before relying on this repository:

1. Inspect its README, license, authorship/provenance, and relevant folders.
2. Tell me which parts are useful as conceptual references and which code, if any, the license permits us to reuse.
3. Do not copy a website clone, assignment solution, branded UI, proprietary assets, or substantial implementation code. The assignment warns that plagiarism from existing repositories can result in disqualification.
4. Prefer implementing the design and behavior independently from the assignment requirements and my reference notes. If a small utility or library is license-compatible and genuinely reusable, identify the exact files, license terms, and attribution obligations before using it.
5. Never hide copied work, remove attribution, or represent third-party implementation as original.

If the reference URL has not been supplied, ask me to provide it at the next appropriate point; continue independent planning that does not depend on it.

## Working agreement

- Start each milestone by inspecting the repository and stating a concise plan, files likely to change, and any assumptions.
- Do not replace the chosen stack or introduce major dependencies without explaining the tradeoff and asking me first.
- Keep frontend, backend, API schemas, persistence, and UI components separated cleanly.
- Use typed request/response models and clear API error responses.
- Enforce business rules on the backend as well as reflecting them in the UI.
- Never collect or store payment card data. A mock checkout must be labeled as a demo confirmation.
- Never commit credentials, API keys, personal data, or local environment files.
- Preserve existing user work. Inspect Git status before broad edits; do not reset, force-push, or discard changes.
- Implement in small reviewable milestones. Do not scaffold every optional feature before the primary booking flow works.
- When a requirement is ambiguous, state a sensible assumption and proceed unless it would cause significant rework or violate the assignment.
- Be honest about what was run and verified. Do not claim deployment, tests, or a workflow succeeded unless there is evidence.

## Product scope

### Required guest experience

1. Explore page with photo-forward listing cards, title, location, nightly price, rating, and wishlist control.
2. Search by location, date range, guest count, and practical filters such as price range, property type, and amenities.
3. Listing detail with gallery, description, location, host information, amenities, reviews, calendar/availability, and price breakdown.
4. Booking flow with valid date range and guest count, no unavailable/overlapping dates, persisted booking, mock confirmation, and My Trips history.
5. Confirmed booking dates must be blocked for later availability checks.
6. Host dashboard with owned listings and bookings, plus create, edit, and delete listing workflows.
7. Useful loading, empty, validation, success, and error states; responsive desktop and mobile layout.

### Mock or defer unless the core is complete

- Real payments, payment cards, refunds, and payout processing.
- Identity verification and production authentication.
- Guest-host messaging and real-time notifications.
- Live maps, dynamic market pricing, and cloud image storage.
- Optional bonus features: interactive map pins, post-stay review submission, cloud uploads, dark mode.

Keep mocks believable, labeled, and documented. Seed representative listings, hosts, reviews, and a few bookings so the demo is useful immediately.

## Data and business rules

Propose and document a normalized SQLite schema. A reasonable starting point is `users`, `listings`, `listing_images`, `amenities`, `listing_amenities`, `bookings`, `reviews`, and `wishlists`; adjust with justification.

- Persist listing CRUD and bookings in SQLite; do not rely only on browser state for required data.
- Validate check-in/check-out ordering, guest capacity, past dates, and listing existence on the backend.
- Reject date ranges overlapping confirmed bookings. Treat check-out as exclusive when implementing overlap logic and document the convention.
- Compute price totals consistently from nightly price, nights, and clearly named mock fees. Do not trust a client-submitted total.
- Use a transaction or equivalent safe approach when creating a booking and reserving dates.
- Keep seed data deterministic and provide a documented reset/reseed path.

## Visual implementation guidance

- Study reference pages using browser inspection and screenshots, then write observations in `docs/reference-notes.md`.
- Record page hierarchy, widths, spacing, typography, color, image ratios/cropping, responsive behavior, and interactive states.
- Recreate general layout and interaction patterns using independently written code. Use original or licensed images and neutral/original branding for the assignment implementation.
- Build reusable components around observed patterns; avoid one enormous page component.
- Check the actual running application at desktop and mobile viewports. Fix the biggest visual mismatches before adding low-priority features.

## Suggested repository layout

```text
frontend/                 # Next.js + TypeScript
backend/                  # FastAPI + SQLite
docs/
  reference-notes.md
  screenshots/
README.md
```

Adapt to an existing repository rather than forcing this structure if it already has a sound organization.

## Milestones

1. Assignment/repository audit and implementation plan.
2. Reference page inventory, screenshots, and design notes.
3. Backend skeleton, schema, seed data, and API contract.
4. Explore/search and listing cards.
5. Listing details and availability.
6. End-to-end booking, persistence, and My Trips.
7. Host dashboard and listing CRUD.
8. Responsive polish, accessibility basics, and manual browser verification.
9. README, deployment configuration, hosted demo, and final handoff.

At each milestone, report: changes made, commands run, workflows verified, known gaps, and the next milestone. Ask for user approval before external publishing actions such as making a GitHub repository public or deploying if credentials/account choices are not already authorized.

## Verification and final handoff

For each milestone, provide a short manual verification checklist. Before handoff, verify the core user journeys in a browser and check server logs/console for errors. If the user asks for automated tests, add and run tests; otherwise do not claim automated coverage.

README must cover:

- Prerequisites and exact local setup/run commands for frontend and backend.
- Environment variables with a safe `.env.example` and no secrets.
- Architecture overview and frontend/backend responsibilities.
- SQLite schema and relationships.
- API routes with representative request/response behavior.
- Seed/reset instructions and mock-service assumptions.
- Deployment instructions, live demo URL, and known limitations.

Capture app screenshots for README/demo walkthrough: Explore, filtered results, Listing Detail, selected dates/price breakdown, booking confirmation, My Trips, Host Dashboard/form, and one mobile view. Screenshots are supporting material unless the evaluator separately requires them.
