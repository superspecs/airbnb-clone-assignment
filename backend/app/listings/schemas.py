from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.core.dates import today
from app.models import Category, PropertyType, RoomType

# --- Requests ---------------------------------------------------------------------------


class ListingSearchParams(BaseModel):
    """Query parameters for GET /listings. Prices are nightly, in paise."""

    location: str | None = Field(None, max_length=100, description="Matches city, state, country, area, or title")
    check_in: date | None = None
    check_out: date | None = Field(None, description="Exclusive; required together with check_in")
    guests: int | None = Field(None, ge=1, le=50)
    min_price: int | None = Field(None, ge=0)
    max_price: int | None = Field(None, ge=0)
    property_type: list[PropertyType] = Field(default_factory=list, description="Repeat to match any of several")
    room_type: RoomType | None = None
    category: Category | None = None
    amenities: list[str] = Field(default_factory=list, description="Amenity codes; listing must have all")
    min_bedrooms: int | None = Field(None, ge=0)
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=50)

    @model_validator(mode="after")
    def check_ranges(self) -> Self:
        if (self.check_in is None) != (self.check_out is None):
            raise ValueError("check_in and check_out must be provided together")
        if self.check_in and self.check_out:
            if self.check_out <= self.check_in:
                raise ValueError("check_out must be after check_in")
            if self.check_in < today():
                raise ValueError("check_in cannot be in the past")
        if self.min_price is not None and self.max_price is not None and self.min_price > self.max_price:
            raise ValueError("min_price cannot exceed max_price")
        return self


# --- Responses --------------------------------------------------------------------------


class ImageOut(BaseModel):
    url: str
    alt: str


class AmenityOut(BaseModel):
    code: str
    name: str
    icon: str


class HostOut(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None
    is_superhost: bool
    joined_at: datetime


class ListingCard(BaseModel):
    """Summary used by Explore cards and map pins. Money is in paise."""

    id: int
    title: str
    property_type: PropertyType
    room_type: RoomType
    category: Category
    city: str
    state: str
    country: str
    latitude: float
    longitude: float
    nightly_price: int
    currency: str
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    rating: float | None = Field(description="Average review rating, null when there are no reviews")
    review_count: int
    is_superhost: bool
    images: list[ImageOut]


class ListingSearchResponse(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReviewAuthor(BaseModel):
    id: int
    name: str
    avatar_url: str | None


class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime
    author: ReviewAuthor


class RatingBucket(BaseModel):
    stars: int
    count: int


class RatingSummary(BaseModel):
    average: float | None
    count: int
    distribution: list[RatingBucket]  # 5 → 1 stars


class ListingDetail(ListingCard):
    description: str
    address: str
    cleaning_fee: int
    amenities: list[AmenityOut]
    host: HostOut
    rating_summary: RatingSummary
    reviews: list[ReviewOut]
    created_at: datetime


class BlockedRange(BaseModel):
    check_in: date
    check_out: date = Field(description="Exclusive: this date is available for a new check-in")


class AvailabilityResponse(BaseModel):
    listing_id: int
    start: date
    end: date
    blocked: list[BlockedRange]
