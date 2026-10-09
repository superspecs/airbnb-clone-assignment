"""Deterministic seed loader.

Content is fixed; booking and review dates are offsets from "today" so the demo always has
upcoming reservations. Re-running a reset therefore produces the same data relative to the day
it runs.
"""

import random
from datetime import UTC, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.bookings.pricing import calculate_price
from app.core.dates import today
from app.models import Amenity, Booking, BookingStatus, Listing, ListingImage, Review, RoomType, User
from app.seed import data

RANDOM_SEED = 20261008

# (listing index, guest index, check-in offset, nights, status) — offsets in days from today.
# Listing 0 has back-to-back stays (check-out == next check-in) to exercise the exclusive
# check-out rule, plus a cancelled stay that must NOT block availability.
UPCOMING_BOOKINGS: list[tuple[int, int, int, int, BookingStatus]] = [
    (0, 0, 5, 3, BookingStatus.CONFIRMED),
    (0, 1, 8, 2, BookingStatus.CONFIRMED),
    (0, 2, 14, 3, BookingStatus.CANCELLED),
    (1, 3, 10, 4, BookingStatus.CONFIRMED),
    (4, 0, 3, 2, BookingStatus.CONFIRMED),
    (6, 4, 12, 5, BookingStatus.CONFIRMED),
    (7, 5, 21, 3, BookingStatus.CONFIRMED),
    (11, 6, 7, 2, BookingStatus.CONFIRMED),
    (12, 7, 30, 4, BookingStatus.CONFIRMED),
    (17, 2, 2, 3, BookingStatus.CONFIRMED),
    (20, 1, 18, 3, BookingStatus.CONFIRMED),
    (24, 3, 9, 2, BookingStatus.CONFIRMED),
    (30, 4, 25, 5, BookingStatus.CONFIRMED),
]
# Completed stays (negative offsets); each gets a linked review.
PAST_BOOKINGS: list[tuple[int, int, int, int]] = [
    (0, 3, -40, 3),
    (2, 5, -25, 2),
    (5, 6, -60, 4),
    (13, 7, -33, 2),
    (21, 0, -50, 3),
]
# Completed stays with no review yet, so the demo guests (Priya, Sana) can leave one.
UNREVIEWED_PAST_BOOKINGS: list[tuple[int, int, int, int]] = [
    (9, 0, -12, 2),
    (15, 1, -20, 3),
]


def _photo_url(photo_id: str) -> str:
    return data.UNSPLASH_URL.format(id=photo_id)


def _image_ids(index: int, seed: data.ListingSeed) -> list[tuple[str, str]]:
    """Pick five distinct photos (id, room label) for a listing from the themed pools."""
    exteriors = data.EXTERIOR_PHOTOS[seed.category]
    candidates = [
        (exteriors[index % len(exteriors)], "exterior"),
        (data.LIVING_PHOTOS[index % len(data.LIVING_PHOTOS)], "living area"),
        (data.BEDROOM_PHOTOS[index % len(data.BEDROOM_PHOTOS)], "bedroom"),
        (data.KITCHEN_PHOTOS[index % len(data.KITCHEN_PHOTOS)], "kitchen"),
        (data.BATHROOM_PHOTOS[index % len(data.BATHROOM_PHOTOS)], "bathroom"),
    ]
    if seed.room_type is RoomType.PRIVATE_ROOM:
        # Lead with the room itself for private-room listings.
        candidates[0], candidates[2] = candidates[2], candidates[0]
    chosen: list[tuple[str, str]] = []
    for photo_id, label in candidates + [(p, "detail") for p in data.EXTRA_PHOTOS]:
        if photo_id not in {c[0] for c in chosen}:
            chosen.append((photo_id, label))
        if len(chosen) == 5:
            break
    return chosen


def _midday(days_from_today: int) -> datetime:
    return datetime.combine(today() + timedelta(days=days_from_today), time(12), tzinfo=UTC)


def _review_text(rng: random.Random) -> str:
    return " ".join(
        [rng.choice(data.REVIEW_OPENERS), rng.choice(data.REVIEW_DETAILS), rng.choice(data.REVIEW_CLOSERS)]
    )


def _make_booking(listing: Listing, guest: User, offset: int, nights: int, status: BookingStatus) -> Booking:
    price = calculate_price(listing.nightly_price, listing.cleaning_fee, nights)
    check_in = today() + timedelta(days=offset)
    return Booking(
        listing=listing,
        guest=guest,
        check_in=check_in,
        check_out=check_in + timedelta(days=nights),
        guests=min(2, listing.max_guests),
        status=status,
        nights=price.nights,
        nightly_price=price.nightly_price,
        subtotal=price.subtotal,
        cleaning_fee=price.cleaning_fee,
        service_fee=price.service_fee,
        total=price.total,
        created_at=_midday(min(offset, 0) - 7),
    )


def load_seed_data(db: Session) -> None:
    """Insert all seed rows into an empty database. Caller commits."""
    rng = random.Random(RANDOM_SEED)

    amenities = {
        code: Amenity(code=code, name=name, icon=icon) for code, name, icon in data.AMENITIES
    }
    db.add_all(amenities.values())

    def make_user(seed: data.UserSeed, joined_days_ago: int) -> User:
        return User(
            name=seed.name,
            email=seed.email,
            bio=seed.bio,
            is_host=seed.is_host,
            is_superhost=seed.is_superhost,
            created_at=_midday(-joined_days_ago),
        )

    hosts = [make_user(s, 900 - i * 120) for i, s in enumerate(data.HOSTS)]
    guests = [make_user(s, 400 - i * 30) for i, s in enumerate(data.GUESTS)]
    db.add_all(hosts + guests)

    listings: list[Listing] = []
    for index, seed in enumerate(data.LISTINGS):
        codes = dict.fromkeys(
            data.BASE_AMENITIES + data.CATEGORY_AMENITIES[seed.category] + list(seed.extra_amenities)
        )
        listing = Listing(
            host=hosts[seed.host],
            title=seed.title,
            description="\n\n".join(
                [seed.blurb, data.CATEGORY_PARAGRAPHS[seed.category], data.CLOSING_PARAGRAPH]
            ),
            property_type=seed.property_type,
            room_type=seed.room_type,
            category=seed.category,
            address=f"{seed.address}, {seed.city}",
            city=seed.city,
            state=seed.state,
            country="India",
            latitude=seed.latitude,
            longitude=seed.longitude,
            nightly_price=seed.nightly_rupees * 100,
            cleaning_fee=seed.cleaning_rupees * 100,
            max_guests=seed.max_guests,
            bedrooms=seed.bedrooms,
            beds=seed.beds,
            bathrooms=seed.bathrooms,
            created_at=_midday(-300 + index * 7),
            updated_at=_midday(-300 + index * 7),
            amenities=[amenities[code] for code in codes],
            images=[
                ListingImage(url=_photo_url(photo_id), alt=f"{seed.title} — {label}", position=pos)
                for pos, (photo_id, label) in enumerate(_image_ids(index, seed))
            ],
        )
        listings.append(listing)
    db.add_all(listings)

    for listing_i, guest_i, offset, nights, status in UPCOMING_BOOKINGS:
        db.add(_make_booking(listings[listing_i], guests[guest_i], offset, nights, status))

    for listing_i, guest_i, offset, nights in PAST_BOOKINGS:
        booking = _make_booking(listings[listing_i], guests[guest_i], offset, nights, BookingStatus.CONFIRMED)
        db.add(booking)
        db.add(
            Review(
                listing=listings[listing_i],
                author=guests[guest_i],
                booking=booking,
                rating=5,
                comment=_review_text(rng),
                created_at=_midday(offset + nights + 2),
            )
        )

    for listing_i, guest_i, offset, nights in UNREVIEWED_PAST_BOOKINGS:
        db.add(_make_booking(listings[listing_i], guests[guest_i], offset, nights, BookingStatus.CONFIRMED))

    # Historic reviews (not tied to a seeded booking) so every listing has a rating.
    for index, listing in enumerate(listings):
        for k in range(3 + (index * 5) % 6):
            db.add(
                Review(
                    listing=listing,
                    author=guests[(index + k) % len(guests)],
                    rating=rng.choices([5, 4, 3], weights=[70, 25, 5])[0],
                    comment=_review_text(rng),
                    created_at=_midday(-(70 + k * 23 + index)),
                )
            )
