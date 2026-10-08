# Reference Notes

Observations from Airbnb (served as airbnb.co.in, English, INR), captured logged out at a
**1440×900 desktop viewport** on 2026-10-08. Screenshots live in `docs/screenshots/reference/`
and are private visual references only (git-ignored). We recreate layout and interaction
**patterns** with original code, branding, copy, and images — no Airbnb assets, logos, or text.

Measurements come from computed styles in DevTools; values are approximate.

## Global tokens

| Token | Observed | Notes |
|---|---|---|
| Font | Proprietary sans ("Cereal") | Use a licensed/free geometric sans fallback, not theirs |
| Base text | 14px, color #222 | Secondary text grey ~#6A6A6A |
| Section heading (h2) | 20px / 600 | Detail page h1: 26px / 500 |
| Brand accent | Pink-red gradient on primary CTAs (Search, Reserve, Continue) | Choose our own accent colour |
| Dark CTA | #222 background, white text, 12px radius | Filter modal "Show N places" |
| Surface grey | #F2F2F2 (round icon buttons), #DDD (borders) | |
| Card image radius | 20px (explore), ~12px (detail gallery outer corners) | |
| Pills / chips | 1px #DDD border, fully rounded, 12px text | |
| Shadow | `0 6px 16px rgba(0,0,0,.12)` on booking widget, dropdowns | |
| Content width | Explore: 48px side gutters (full width); detail: 1120px column (160px gutters at 1440) | |

## Page inventory

### Header (all pages) — `desktop-01`, `desktop-05`, `desktop-12`
- Logo left; account (round, grey) + hamburger (round, grey, 40px) right; "Become a host" text link.
- **Home**: tall header (~200px) with category tabs (All / Homes / Experiences / Services) above a
  large 3-segment search pill (850×66, radius 32): *Where · When · Who* + circular search button.
- **Results/detail**: compact pill (Location · Dates · Guests + small round search button) inline
  in a 96px header; clicking it expands back to the full pill.
- Detail page header is **not sticky**; it is replaced on scroll by a section nav (see Detail).

### Search interactions — `desktop-02`, `03`, `04`
- Focusing a segment turns that segment white with a shadow while the rest of the pill goes grey;
  the search button expands into a pill labelled "Search".
- **Where**: dropdown panel (~425px wide, radius 32) with "Suggested destinations" — icon tile +
  title + one-line subtitle. Typing filters to place suggestions (icon + name + type).
- Selecting a place auto-advances to **When**: two-month calendar panel (width of pill) with a
  Dates / Flexible segmented toggle and Exact-date selectors below. Past dates are greyed.
- **Who** (not captured on home; same pattern as detail-page guests dropdown below).

### Explore home — `desktop-01`
- Horizontal rows ("Destinations for you", "Popular homes in …") each with a heading, optional
  subtitle, and prev/next round arrow buttons at the right.
- Row cards: ~182×173 image (radius 20), 8 per row at 1440 with ~12px gap; badge pill
  top-left ("Guest favourite"), heart top-right; below: title (13px/500), "₹X for N nights · ★ 4.9".
- Footer: three link columns (Support / Hosting / Company) + bottom bar (language, currency).

### Search results — `desktop-05`, `06`, `07`, `08`
- Under the header, a **filter chip row**: "Filters" button (icon) + divider + quick toggle chips
  (amenities, "Guest favourite", etc.).
- Two-pane layout: results grid left (~640px, 2 columns), **map right** (~658px, radius 20, sticky)
  with white price-pill pins; selected/hovered pin turns black.
- Heading "Over 1,000 homes in <place>" + "Prices include all fees" note.
- Result card (307×363): image 307×230 (≈4:3, radius 20) with photo dots, hover reveals
  next/prev arrows (`06`); badge + heart overlay. Text: "<Type> in <Area>" bold + "★ 4.97 (34)"
  right-aligned; listing name (grey, truncated); "1 bedroom · 1 bed · 1 bathroom";
  "**₹17,698** for 3 nights" (underlined, struck-through original price when discounted);
  small grey tag ("Free cancellation").
- Clicking the price opens a **Price details** popover (`07`): "3 nights × ₹X  ₹total".
- **Pagination** (`08`): centred numbered pages, current page = black filled circle,
  prev/next chevrons, ellipsis before last page. ~18 results per page.

### Filters modal — `desktop-09`, `10`, `11`
- Centred modal 568px wide, radius 32, sticky title bar ("Filters" + close ×) and sticky footer
  ("Clear all" text button left, dark "Show N places" button right). Body scrolls.
- Sections separated by 1px dividers: Recommended (4 icon tiles), **Type of place** (3-way
  segmented control: Any / Room / Entire home), **Price range** (histogram + dual-thumb slider +
  Minimum/Maximum pill inputs), **Rooms and beds** (−/Any/+ steppers), **Amenities**
  (icon + label pills, "Show more"), then more sections (booking options, property type, etc.).

### Listing detail — `desktop-12` to `desktop-20`
- **Title row** (`12`): h1 left; "Share" and "♡ Save" underlined text buttons right.
- **Gallery**: 1120×476 grid — one large image (left half) + 2×2 small images, 8px gaps, outer
  corners rounded; "Show all photos" button bottom-right (white/grey, radius 8).
- **Two-column body** below the gallery: content ~654px left, booking widget ~372px right.
- Left column order: type + location heading ("Entire serviced apartment in …"), capacity line
  ("3 guests · 1 bedroom · 1 bed · 1 bathroom"), rating highlight box, "Hosted by …" row with
  avatar, 3 icon highlights, description, "Where you'll sleep" (room image cards, `14b`),
  **What this place offers** (2-column icon list, unavailable items struck through,
  "Show all N amenities" grey button), **calendar section** "N nights in <place>" with
  two-month inline calendar and "Clear dates" (`15`).
- **Booking widget** (`13`, `14`): card radius 12 with shadow; "₹total for N nights";
  bordered 2×1 grid CHECK-IN | CHECKOUT, then GUESTS dropdown; cancellation note pill;
  full-width gradient **Reserve** button (48px, fully rounded); "You won't be charged yet".
  The widget is **sticky** (top ≈ 80px) while scrolling the left column.
- **Guests dropdown** (`19`): Adults / Children / Infants / Pets rows with round −/+ steppers
  (minus disabled at minimum), capacity note, "Close" link.
- **Calendar states** (`15`): selected start/end = black filled circles; in-range days = light grey
  band; **unavailable/past days = grey with strikethrough** and not clickable.
- **Sticky section nav** (`15`–`18`): after scrolling past the gallery a white bar appears with
  anchors Photos · Amenities · Reviews · Location; once the widget scrolls away, the bar also
  shows "₹total for N nights · ★ rating" and a compact **Reserve** button on the right.
- **Reviews** (`16`): large centred rating with badge, category score row (Cleanliness, Accuracy,
  Check-in, Communication, Location, Value) with a 5→1 distribution bar, "Guests mention" chips,
  then a 2-column grid of review cards (avatar, name, tenure, stars · date, text, "Show more").
- **Location** (`17`): "Where you'll be", place line, full-width map (radius 20) with a single
  black home marker, zoom controls; "Exact location will be provided after booking".
- **Host** (`18`): host card (avatar with verified badge, name, Reviews / Rating / Years hosting
  stats), host details, grey "Message host" button; then **Things to know** in 3 columns
  (Cancellation policy · House rules · Safety & property).
- **Photo tour** (`20`): full-page view with back arrow, Share/Save, thumbnail index by room,
  then sections (room name + features left, large images right). Screenshot caught a fade-in.

### Account & auth (logged out) — `desktop-21`, `22`, `23`
- Hamburger opens a dropdown card (radius 12, shadow): Languages & currency, Help, a
  "Become a host" promo block, links, "Log in or sign up".
- Wishlist heart / "Save" when logged out opens a centred **Log in or sign up** modal
  (input, primary Continue button, social buttons).
- `/trips` redirects to a full-page login screen.

### Modals seen on first visit — `desktop-00`, `05` (before dismissal)
- Promotional and "prices include all fees" modals: centred card, radius ~32, dimmed backdrop,
  close ×, single primary CTA. Pattern useful for our toasts/notices; content not reused.

## Not inspected
- **Mobile/tablet** viewports (out of scope per user instruction). Responsive behaviour must be
  designed from standard patterns.
- **Logged-in pages**: My Trips, wishlists, host dashboard, create-listing wizard, and the
  checkout/confirm page after Reserve (blocked as a real-transaction action). Design these from
  the assignment requirements using the patterns above.
- Host landing (`desktop-24`) was captured mid-load (skeleton only).

## Behaviour reference: MERN repository (sudeepmahato16/airbnb-clone, MIT)
Used only to confirm common flows: category row on explore, multi-step "list your home" wizard,
calendar with booked dates disabled, user menu entries (Trips, Favorites, Reservations on my
listings, My properties), load-more pagination. No code, assets, text, branding, or data reused.
