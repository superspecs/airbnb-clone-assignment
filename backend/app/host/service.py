"""Host listing management. Every operation is scoped to the listings the host owns."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.dates import today
from app.core.errors import AppError
from app.host import schemas
from app.models import Amenity, Booking, BookingStatus, Listing, ListingImage, User


def _owned_listing(db: Session, host: User, listing_id: int) -> Listing:
    listing = db.scalars(
        select(Listing)
        .where(Listing.id == listing_id, Listing.deleted_at.is_(None))
        .options(selectinload(Listing.images), selectinload(Listing.amenities))
    ).first()
    if listing is None:
        raise AppError(404, "LISTING_NOT_FOUND", f"Listing {listing_id} does not exist.")
    if listing.host_id != host.id:
        raise AppError(403, "NOT_OWNER", "You can only manage your own listings.")
    return listing


def _resolve_amenities(db: Session, codes: list[str]) -> list[Amenity]:
    if not codes:
        return []
    found = {a.code: a for a in db.scalars(select(Amenity).where(Amenity.code.in_(codes)))}
    unknown = [c for c in codes if c not in found]
    if unknown:
        raise AppError(422, "UNKNOWN_AMENITY", f"Unknown amenity code(s): {', '.join(unknown)}.")
    return [found[c] for c in codes]


def _apply(db: Session, listing: Listing, data: schemas.ListingInput) -> None:
    for field in (
        "title", "description", "property_type", "room_type", "category", "address", "city", "state",
        "country", "latitude", "longitude", "nightly_price", "cleaning_fee", "max_guests", "bedrooms",
        "beds", "bathrooms",
    ):
        setattr(listing, field, getattr(data, field))
    listing.amenities = _resolve_amenities(db, data.amenities)
    # Replace photos: remove the old rows first so (listing_id, position) stays unique.
    if listing.images:
        listing.images.clear()
        db.flush()
    listing.images = [
        ListingImage(url=url, alt=f"{data.title} — photo {i + 1}", position=i)
        for i, url in enumerate(data.image_urls)
    ]


def _detail(listing: Listing) -> schemas.HostListingDetail:
    return schemas.HostListingDetail(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        property_type=listing.property_type,
        room_type=listing.room_type,
        category=listing.category,
        address=listing.address,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        latitude=listing.latitude,
        longitude=listing.longitude,
        nightly_price=listing.nightly_price,
        cleaning_fee=listing.cleaning_fee,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        amenities=[a.code for a in listing.amenities],
        image_urls=[img.url for img in listing.images],
    )


def _upcoming_count(db: Session, listing_ids: list[int]) -> dict[int, int]:
    if not listing_ids:
        return {}
    rows = db.execute(
        select(Booking.listing_id, func.count(Booking.id))
        .where(
            Booking.listing_id.in_(listing_ids),
            Booking.status == BookingStatus.CONFIRMED,
            Booking.check_out > today(),
        )
        .group_by(Booking.listing_id)
    ).all()
    return dict(rows)


def list_listings(db: Session, host: User) -> list[schemas.HostListingSummary]:
    listings = db.scalars(
        select(Listing)
        .where(Listing.host_id == host.id, Listing.deleted_at.is_(None))
        .options(selectinload(Listing.images))
        .order_by(Listing.created_at.desc(), Listing.id.desc())
    ).all()
    upcoming = _upcoming_count(db, [listing.id for listing in listings])
    return [
        schemas.HostListingSummary(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            state=listing.state,
            property_type=listing.property_type,
            nightly_price=listing.nightly_price,
            currency=settings.currency,
            max_guests=listing.max_guests,
            image_url=listing.images[0].url if listing.images else None,
            upcoming_bookings=upcoming.get(listing.id, 0),
            created_at=listing.created_at,
        )
        for listing in listings
    ]


def get_listing(db: Session, host: User, listing_id: int) -> schemas.HostListingDetail:
    return _detail(_owned_listing(db, host, listing_id))


def create_listing(db: Session, host: User, data: schemas.ListingInput) -> schemas.HostListingDetail:
    listing = Listing(host_id=host.id)
    _apply(db, listing, data)
    db.add(listing)
    db.commit()
    return get_listing(db, host, listing.id)


def update_listing(db: Session, host: User, listing_id: int, data: schemas.ListingInput) -> schemas.HostListingDetail:
    listing = _owned_listing(db, host, listing_id)
    _apply(db, listing, data)
    db.commit()
    return get_listing(db, host, listing_id)


def delete_listing(db: Session, host: User, listing_id: int) -> None:
    """Soft delete so past guests keep their trip history. Refused while stays are upcoming."""
    listing = _owned_listing(db, host, listing_id)
    if _upcoming_count(db, [listing.id]).get(listing.id):
        raise AppError(
            409,
            "HAS_UPCOMING_BOOKINGS",
            "This listing has upcoming confirmed bookings, so it can't be deleted yet.",
        )
    listing.deleted_at = datetime.now(UTC)
    db.commit()
