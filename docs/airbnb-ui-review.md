# Airbnb Desktop UI Review

Compared: our app (local production build on :3010, seeded data) vs. public Airbnb (airbnb.co.in,
logged out, isolated browser context) at **1280×800** and **1440×900**. Reference screenshots live
in `docs/screenshots/reference/` (git-ignored, private). Only layout/behaviour is compared; no
Airbnb code, text, or images are reused.

## Baseline differences

| Page / state | Airbnb | Ours (baseline) | Priority |
|---|---|---|---|
| Header search — When | Click opens a panel with a two-month calendar, range highlight, past days greyed | Two native `<input type=date>` fields (browser picker, dd/mm/yyyy text) | High |
| Header search — Who | Panel with Adults / Children / Infants / Pets steppers | Single "Guests" stepper | Medium |
| Results header | Compact pill "Homes in North Goa · 13–16 Nov · 2 guests" | Full search pill stays expanded | Low |
| Results heading | "Over 1,000 homes in North Goa" | "5 stays in goa" (raw lowercase query) | Low |
| Result card title | "Flat in Candolim" + "★ 4.97 (34)" | "Candolim, Goa" + "★ 4.75" | Medium |
| Result card price with dates | "**₹17,698** for 3 nights" (stay total) | "₹3,800 night" even when dates are chosen | High |
| Results map | Map on the right with price pins (2-column grid) | No map on Explore | Low (mockable) |
| Detail — scrolling past widget | Sticky bar: Photos · Amenities · Reviews · Location + price + Reserve | Widget scrolls away with nothing replacing it | Medium |
| Detail — reviews | Category scores (Cleanliness, Accuracy, …) | Overall average + distribution only | Low |
| Missing page | Branded "page not found" with links back | Next.js default "404 This page could not be found." | Medium |
| Layout at 1280 | No horizontal scroll | No horizontal scroll (verified `scrollWidth` = 1280) | — |

Matches already in place: card image ratio and rounded corners, heart overlay, badge pill, photo
dots/arrows on hover, category row with underline, Filters modal structure, 1+4 gallery grid,
"Show all photos", booking widget box (CHECK-IN | CHECKOUT / GUESTS), struck-through unavailable
days, "You won't be charged", user menu dropdown.

## After improvements (re-checked at 1440×900 and 1280×800)

| Difference | Status |
|---|---|
| Search When → calendar panel | Fixed (two-month panel, past days disabled, auto-advance to Who) |
| Search Who → guest breakdown | Fixed (Adults / Children; infants/pets not modelled) |
| Card title, rating count, stay price | Fixed ("Villa in Assagao", "★ 4.38 (8)", "₹43,500 for 3 nights") |
| Results heading casing | Fixed ("2 stays in Goa · …") |
| Detail sticky section/Reserve bar | Fixed |
| Missing page | Fixed (branded 404) |
| Results map with price pins | Open — optional (assignment allows a static/basic map) |
| Compact results header pill | Open — low priority |
| Review category scores | Open — data model has overall rating only |

See `docs/improvement-log.md` for per-cycle details.
