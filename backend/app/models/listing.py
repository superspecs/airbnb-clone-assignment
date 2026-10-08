from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.amenity import Amenity, listing_amenities
from app.models.base import str_enum, utcnow

if TYPE_CHECKING:
    from app.models.user import User


class PropertyType(StrEnum):
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    CABIN = "cabin"
    COTTAGE = "cottage"


class RoomType(StrEnum):
    ENTIRE_PLACE = "entire_place"
    PRIVATE_ROOM = "private_room"


class Category(StrEnum):
    BEACHFRONT = "beachfront"
    AMAZING_POOLS = "amazing_pools"
    CABINS = "cabins"
    MOUNTAIN_VIEWS = "mountain_views"
    CITY_STAYS = "city_stays"
    COUNTRYSIDE = "countryside"
    LAKEFRONT = "lakefront"


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("nightly_price > 0", name="ck_listings_nightly_price_positive"),
        CheckConstraint("cleaning_fee >= 0", name="ck_listings_cleaning_fee_non_negative"),
        CheckConstraint("max_guests >= 1", name="ck_listings_max_guests_min"),
        CheckConstraint("bedrooms >= 0 AND beds >= 1 AND bathrooms >= 0", name="ck_listings_rooms"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_host_id", "host_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[PropertyType] = mapped_column(str_enum(PropertyType, "property_type"))
    room_type: Mapped[RoomType] = mapped_column(str_enum(RoomType, "room_type"))
    category: Mapped[Category] = mapped_column(str_enum(Category, "category"))

    address: Mapped[str] = mapped_column(String(255))  # neighbourhood-level; exact address is not exposed
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    # Money in integer minor units (paise).
    nightly_price: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)

    max_guests: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer)
    beds: Mapped[int] = mapped_column(Integer)
    bathrooms: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # soft delete

    host: Mapped["User"] = relationship(back_populates="listings")
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing", order_by="ListingImage.position", cascade="all, delete-orphan"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities, order_by=Amenity.name)


class ListingImage(Base):
    __tablename__ = "listing_images"
    __table_args__ = (UniqueConstraint("listing_id", "position", name="uq_listing_images_position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer)  # 0 = cover photo

    listing: Mapped[Listing] = relationship(back_populates="images")
