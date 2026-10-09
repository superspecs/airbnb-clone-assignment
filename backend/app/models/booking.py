from datetime import date, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import DDL, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import str_enum, utcnow
from app.models.listing import Listing
from app.models.user import User

if TYPE_CHECKING:
    from app.models.review import Review


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Booking(Base):
    """A reservation of [check_in, check_out) — check-out day is exclusive.

    Price fields are a snapshot taken at booking time (integer paise), so later
    listing price edits never change an existing booking.
    """

    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_bookings_dates_ordered"),
        CheckConstraint("guests >= 1", name="ck_bookings_guests_min"),
        CheckConstraint("nights >= 1", name="ck_bookings_nights_min"),
        Index("ix_bookings_availability", "listing_id", "status", "check_in", "check_out"),
        Index("ix_bookings_guest_id", "guest_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="RESTRICT"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer)
    status: Mapped[BookingStatus] = mapped_column(str_enum(BookingStatus, "booking_status"))

    nights: Mapped[int] = mapped_column(Integer)
    nightly_price: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer)
    service_fee: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    listing: Mapped[Listing] = relationship()
    guest: Mapped[User] = relationship()
    # The guest's review of this stay, if any (reviews.booking_id is unique).
    review: Mapped["Review | None"] = relationship(back_populates="booking")


# Database-level guarantee that confirmed stays never overlap on the same listing, even if
# application checks are bypassed. Ranges overlap iff a.check_in < b.check_out AND
# b.check_in < a.check_out (check-out exclusive). ISO date strings compare correctly as text.
_OVERLAP_CONDITION = """
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.listing_id = NEW.listing_id
          AND b.status = 'confirmed'
          AND b.id IS NOT NEW.id
          AND b.check_in < NEW.check_out
          AND NEW.check_in < b.check_out
    )
"""

BOOKING_TRIGGERS = (
    f"""
    CREATE TRIGGER IF NOT EXISTS trg_bookings_no_overlap_insert
    BEFORE INSERT ON bookings
    WHEN NEW.status = 'confirmed' AND {_OVERLAP_CONDITION}
    BEGIN SELECT RAISE(ABORT, 'BOOKING_OVERLAP'); END
    """,
    f"""
    CREATE TRIGGER IF NOT EXISTS trg_bookings_no_overlap_update
    BEFORE UPDATE OF status, check_in, check_out, listing_id ON bookings
    WHEN NEW.status = 'confirmed' AND {_OVERLAP_CONDITION}
    BEGIN SELECT RAISE(ABORT, 'BOOKING_OVERLAP'); END
    """,
)

# New databases get the triggers with the table; app/bootstrap.py also (re)applies them
# idempotently so databases created before the triggers existed are covered too.
for _ddl in BOOKING_TRIGGERS:
    event.listen(Booking.__table__, "after_create", DDL(_ddl))
