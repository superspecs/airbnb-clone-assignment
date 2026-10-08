"""Listing queries: search, detail, and availability. Route handlers delegate here."""

from datetime import date, timedelta

from sqlalchemy import ColumnElement, Subquery, exists, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.dates import today
from app.core.errors import AppError
from app.listings import schemas
from app.models import Amenity, Booking, BookingStatus, Listing, Review

MAX_AVAILABILITY_DAYS = 730


def _rating_stats() -> Subquery:
    return (
        select(
            Review.listing_id.label("listing_id"),
            func.avg(Review.rating).label("average"),
            func.count(Review.id).label("count"),
        )
        .group_by(Review.listing_id)
        .subquery()
    )


def _overlaps_confirmed_booking(check_in: date, check_out: date) -> ColumnElement[bool]:
    """True when the listing has a confirmed stay overlapping [check_in, check_out).

    Ranges overlap iff existing.check_in < new.check_out AND new.check_in < existing.check_out,
    so a stay may start on the day another one checks out.
    """
    return exists().where(
        Booking.listing_id == Listing.id,
        Booking.status == BookingStatus.CONFIRMED,
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _search_conditions(params: schemas.ListingSearchParams) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = [Listing.deleted_at.is_(None)]

    if params.location and params.location.strip():
        pattern = f"%{_escape_like(params.location.strip())}%"
        conditions.append(
            or_(*(col.ilike(pattern, escape="\\") for col in (
                Listing.city, Listing.state, Listing.country, Listing.address, Listing.title
            )))
        )
    if params.guests is not None:
        conditions.append(Listing.max_guests >= params.guests)
    if params.min_price is not None:
        conditions.append(Listing.nightly_price >= params.min_price)
    if params.max_price is not None:
        conditions.append(Listing.nightly_price <= params.max_price)
    if params.property_type:
        conditions.append(Listing.property_type.in_(params.property_type))
    if params.room_type is not None:
        conditions.append(Listing.room_type == params.room_type)
    if params.category is not None:
        conditions.append(Listing.category == params.category)
    if params.min_bedrooms is not None:
        conditions.append(Listing.bedrooms >= params.min_bedrooms)
    for code in dict.fromkeys(params.amenities):
        conditions.append(Listing.amenities.any(Amenity.code == code))
    if params.check_in and params.check_out:
        conditions.append(~_overlaps_confirmed_booking(params.check_in, params.check_out))

    return conditions


def _round_rating(value: float | None) -> float | None:
    return round(float(value), 2) if value is not None else None


def _card_fields(listing: Listing, average: float | None, count: int) -> dict:
    return dict(
        id=listing.id,
        title=listing.title,
        property_type=listing.property_type,
        room_type=listing.room_type,
        category=listing.category,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        latitude=listing.latitude,
        longitude=listing.longitude,
        nightly_price=listing.nightly_price,
        currency=settings.currency,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        rating=_round_rating(average),
        review_count=count or 0,
        is_superhost=listing.host.is_superhost,
        images=[schemas.ImageOut(url=img.url, alt=img.alt) for img in listing.images],
    )


def search_listings(db: Session, params: schemas.ListingSearchParams) -> schemas.ListingSearchResponse:
    conditions = _search_conditions(params)
    total = db.scalar(select(func.count(Listing.id)).where(*conditions)) or 0

    stats = _rating_stats()
    rows = db.execute(
        select(Listing, stats.c.average, stats.c.count)
        .outerjoin(stats, stats.c.listing_id == Listing.id)
        .where(*conditions)
        .options(selectinload(Listing.images), joinedload(Listing.host))
        .order_by(Listing.id)
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
    ).all()

    return schemas.ListingSearchResponse(
        items=[schemas.ListingCard(**_card_fields(listing, avg, cnt)) for listing, avg, cnt in rows],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=max(1, -(-total // params.page_size)),
    )


def _get_active_listing(db: Session, listing_id: int, *options) -> Listing:
    listing = db.scalars(
        select(Listing).where(Listing.id == listing_id, Listing.deleted_at.is_(None)).options(*options)
    ).first()
    if listing is None:
        raise AppError(404, "LISTING_NOT_FOUND", f"Listing {listing_id} does not exist.")
    return listing


def get_listing_detail(db: Session, listing_id: int) -> schemas.ListingDetail:
    listing = _get_active_listing(
        db,
        listing_id,
        selectinload(Listing.images),
        selectinload(Listing.amenities),
        joinedload(Listing.host),
    )
    reviews = db.scalars(
        select(Review)
        .where(Review.listing_id == listing_id)
        .options(joinedload(Review.author))
        .order_by(Review.created_at.desc(), Review.id.desc())
    ).all()

    count = len(reviews)
    average = sum(r.rating for r in reviews) / count if count else None
    host = listing.host

    return schemas.ListingDetail(
        **_card_fields(listing, average, count),
        description=listing.description,
        address=listing.address,
        cleaning_fee=listing.cleaning_fee,
        amenities=[schemas.AmenityOut(code=a.code, name=a.name, icon=a.icon) for a in listing.amenities],
        host=schemas.HostOut(
            id=host.id,
            name=host.name,
            avatar_url=host.avatar_url,
            bio=host.bio,
            is_superhost=host.is_superhost,
            joined_at=host.created_at,
        ),
        rating_summary=schemas.RatingSummary(
            average=_round_rating(average),
            count=count,
            distribution=[
                schemas.RatingBucket(stars=s, count=sum(1 for r in reviews if r.rating == s))
                for s in range(5, 0, -1)
            ],
        ),
        reviews=[
            schemas.ReviewOut(
                id=r.id,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
                author=schemas.ReviewAuthor(id=r.author.id, name=r.author.name, avatar_url=r.author.avatar_url),
            )
            for r in reviews
        ],
        created_at=listing.created_at,
    )


def get_availability(
    db: Session, listing_id: int, start: date | None, end: date | None
) -> schemas.AvailabilityResponse:
    _get_active_listing(db, listing_id)
    start = start or today()
    end = end or start + timedelta(days=365)
    if end <= start:
        raise AppError(422, "INVALID_DATE_RANGE", "'to' must be after 'from'.")
    if (end - start).days > MAX_AVAILABILITY_DAYS:
        raise AppError(422, "INVALID_DATE_RANGE", f"Range cannot exceed {MAX_AVAILABILITY_DAYS} days.")

    ranges = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.check_in < end,
            Booking.check_out > start,
        )
        .order_by(Booking.check_in)
    ).all()

    return schemas.AvailabilityResponse(
        listing_id=listing_id,
        start=start,
        end=end,
        blocked=[schemas.BlockedRange(check_in=ci, check_out=co) for ci, co in ranges],
    )
