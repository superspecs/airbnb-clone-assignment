from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import str_enum, utcnow
from app.models.listing import Listing
from app.models.user import User


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
