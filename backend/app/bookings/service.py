"""Booking rules. All validation and pricing happen here, never on the client.

Date convention: a stay is [check_in, check_out) — the check-out day is free for the next
guest. Two stays overlap iff a.check_in < b.check_out AND b.check_in < a.check_out.
"""

from datetime import date

from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.bookings import schemas
from app.bookings.pricing import calculate_price
from app.core.config import settings
from app.core.dates import today
from app.core.errors import AppError
from app.db import begin_immediate
from app.listings.service import get_active_listing
from app.models import Booking, BookingStatus, Listing, User

MAX_NIGHTS = 90


def validate_stay(listing: Listing, check_in: date, check_out: date, guests: int, user: User | None) -> int:
    """Check dates, capacity, and ownership. Returns the number of nights."""
    if check_out <= check_in:
        raise AppError(422, "INVALID_DATES", "Check-out must be after check-in.")
    if check_in < today():
        raise AppError(422, "DATES_IN_PAST", "Check-in can't be in the past.")
    nights = (check_out - check_in).days
    if nights > MAX_NIGHTS:
        raise AppError(422, "STAY_TOO_LONG", f"Stays are limited to {MAX_NIGHTS} nights.")
    if guests > listing.max_guests:
        raise AppError(
            422, "TOO_MANY_GUESTS", f"This place allows up to {listing.max_guests} guests."
        )
    if user is not None and listing.host_id == user.id:
        raise AppError(403, "OWN_LISTING", "Hosts can't book their own listing.")
    return nights


def _ensure_available(db: Session, listing_id: int, check_in: date, check_out: date) -> None:
    taken = db.scalar(
        select(
            exists().where(
                Booking.listing_id == listing_id,
                Booking.status == BookingStatus.CONFIRMED,
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
        )
    )
    if taken:
        raise AppError(409, "DATES_UNAVAILABLE", "Those dates are no longer available.")


def _price_out(nights: int, nightly: int, subtotal: int, cleaning: int, service: int, total: int) -> schemas.PriceOut:
    return schemas.PriceOut(
        nights=nights,
        nightly_price=nightly,
        subtotal=subtotal,
        cleaning_fee=cleaning,
        service_fee=service,
        total=total,
        currency=settings.currency,
    )


def quote(
    db: Session, listing_id: int, params: schemas.QuoteParams, user: User | None
) -> schemas.QuoteOut:
    listing = get_active_listing(db, listing_id)
    nights = validate_stay(listing, params.check_in, params.check_out, params.guests, user)
    _ensure_available(db, listing_id, params.check_in, params.check_out)
    p = calculate_price(listing.nightly_price, listing.cleaning_fee, nights)
    return schemas.QuoteOut(
        listing_id=listing_id,
        check_in=params.check_in,
        check_out=params.check_out,
        guests=params.guests,
        price=_price_out(p.nights, p.nightly_price, p.subtotal, p.cleaning_fee, p.service_fee, p.total),
    )


def booking_out(booking: Booking) -> schemas.BookingOut:
    listing = booking.listing
    cover = listing.images[0].url if listing.images else None
    return schemas.BookingOut(
        id=booking.id,
        status=booking.status,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        created_at=booking.created_at,
        price=_price_out(
            booking.nights,
            booking.nightly_price,
            booking.subtotal,
            booking.cleaning_fee,
            booking.service_fee,
            booking.total,
        ),
        listing=schemas.BookingListing(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            state=listing.state,
            image_url=cover,
            host_name=listing.host.name,
            is_active=listing.deleted_at is None,
        ),
        guest=schemas.BookingGuest(id=booking.guest.id, name=booking.guest.name),
    )


_BOOKING_LOAD = (
    joinedload(Booking.listing).selectinload(Listing.images),
    joinedload(Booking.listing).joinedload(Listing.host),
    joinedload(Booking.guest),
)


def create_booking(db: Session, user: User, payload: schemas.BookingCreate) -> schemas.BookingOut:
    # Take SQLite's write lock first so the availability check and insert are atomic with
    # respect to other bookings. A DB trigger also rejects overlaps as a last line of defence.
    begin_immediate(db)
    try:
        listing = get_active_listing(db, payload.listing_id)
        nights = validate_stay(listing, payload.check_in, payload.check_out, payload.guests, user)
        _ensure_available(db, listing.id, payload.check_in, payload.check_out)

        p = calculate_price(listing.nightly_price, listing.cleaning_fee, nights)
        booking = Booking(
            listing_id=listing.id,
            guest_id=user.id,
            check_in=payload.check_in,
            check_out=payload.check_out,
            guests=payload.guests,
            status=BookingStatus.CONFIRMED,
            nights=p.nights,
            nightly_price=p.nightly_price,
            subtotal=p.subtotal,
            cleaning_fee=p.cleaning_fee,
            service_fee=p.service_fee,
            total=p.total,
        )
        db.add(booking)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "BOOKING_OVERLAP" in str(exc.orig):
            raise AppError(409, "DATES_UNAVAILABLE", "Those dates are no longer available.") from exc
        raise
    except Exception:
        db.rollback()
        raise
    return get_booking(db, user, booking.id)


def list_trips(db: Session, user: User) -> list[schemas.BookingOut]:
    bookings = db.scalars(
        select(Booking)
        .where(Booking.guest_id == user.id)
        .options(*_BOOKING_LOAD)
        .order_by(Booking.check_in.desc(), Booking.id.desc())
    ).unique().all()
    return [booking_out(b) for b in bookings]


def _load_visible_booking(db: Session, user: User, booking_id: int) -> Booking:
    booking = db.scalars(select(Booking).where(Booking.id == booking_id).options(*_BOOKING_LOAD)).unique().first()
    # Only the guest or the listing's host may see a booking; otherwise behave as if absent.
    if booking is None or user.id not in (booking.guest_id, booking.listing.host_id):
        raise AppError(404, "BOOKING_NOT_FOUND", f"Booking {booking_id} does not exist.")
    return booking


def get_booking(db: Session, user: User, booking_id: int) -> schemas.BookingOut:
    return booking_out(_load_visible_booking(db, user, booking_id))


def cancel_booking(db: Session, user: User, booking_id: int) -> schemas.BookingOut:
    """The guest or the listing's host may cancel before check-in; the dates free immediately
    (cancelled bookings never block availability). Refunds are simulated: always the full total."""
    # Visibility already limits callers to the guest and the listing's host (others get 404).
    booking = _load_visible_booking(db, user, booking_id)
    if booking.status is BookingStatus.CANCELLED:
        raise AppError(409, "ALREADY_CANCELLED", "This booking is already cancelled.")
    if booking.check_in <= today():
        raise AppError(409, "TRIP_STARTED", "Stays that have started can't be cancelled.")
    booking.status = BookingStatus.CANCELLED
    db.commit()
    return get_booking(db, user, booking_id)


def host_bookings(db: Session, host: User) -> list[schemas.BookingOut]:
    bookings = db.scalars(
        select(Booking)
        .join(Booking.listing)
        .where(Listing.host_id == host.id)
        .options(*_BOOKING_LOAD)
        .order_by(Booking.check_in.desc(), Booking.id.desc())
    ).unique().all()
    return [booking_out(b) for b in bookings]

