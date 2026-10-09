"""Post-stay reviews. One review per booking, written by that booking's guest after check-out."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.dates import today
from app.core.errors import AppError
from app.listings.schemas import ReviewAuthor, ReviewOut
from app.models import Booking, BookingStatus, Review, User
from app.reviews import schemas


def review_out(review: Review) -> ReviewOut:
    author = review.author
    return ReviewOut(
        id=review.id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        author=ReviewAuthor(id=author.id, name=author.name, avatar_url=author.avatar_url),
    )


def _already_reviewed() -> AppError:
    return AppError(409, "ALREADY_REVIEWED", "You've already reviewed this stay.")


def create_review(db: Session, user: User, booking_id: int, data: schemas.ReviewCreate) -> ReviewOut:
    booking = db.scalars(
        select(Booking).where(Booking.id == booking_id).options(joinedload(Booking.listing), joinedload(Booking.review))
    ).first()
    # Same visibility rule as GET /bookings/{id}: strangers can't learn the booking exists.
    if booking is None or user.id not in (booking.guest_id, booking.listing.host_id):
        raise AppError(404, "BOOKING_NOT_FOUND", f"Booking {booking_id} does not exist.")
    if booking.guest_id != user.id:
        raise AppError(403, "NOT_GUEST", "Only the guest who stayed can review this booking.")
    if booking.status is BookingStatus.CANCELLED:
        raise AppError(409, "BOOKING_CANCELLED", "Cancelled stays can't be reviewed.")
    if booking.check_out > today():
        raise AppError(409, "STAY_NOT_COMPLETED", "You can review this stay after check-out.")
    if booking.listing.deleted_at is not None:
        raise AppError(409, "LISTING_REMOVED", "The host has removed this listing, so it can't be reviewed.")
    if booking.review is not None:
        raise _already_reviewed()

    review = Review(
        listing_id=booking.listing_id,
        author_id=user.id,
        booking_id=booking.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError as exc:
        # A concurrent submission won the UNIQUE(booking_id) race.
        db.rollback()
        raise _already_reviewed() from exc
    review = db.scalars(select(Review).where(Review.id == review.id).options(joinedload(Review.author))).one()
    return review_out(review)
