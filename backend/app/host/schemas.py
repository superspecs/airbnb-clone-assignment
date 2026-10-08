from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Category, PropertyType, RoomType

MAX_IMAGES = 10


class ListingInput(BaseModel):
    """Create/replace payload for a host listing. Money is in paise."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=20, max_length=5000)
    property_type: PropertyType
    room_type: RoomType
    category: Category
    address: str = Field(min_length=2, max_length=255, description="Neighbourhood or area")
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    country: str = Field(default="India", min_length=2, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    nightly_price: int = Field(ge=10_000, le=50_000_000, description="₹100 – ₹5,00,000 per night, in paise")
    cleaning_fee: int = Field(default=0, ge=0, le=5_000_000)
    max_guests: int = Field(ge=1, le=16)
    bedrooms: int = Field(ge=0, le=20)
    beds: int = Field(ge=1, le=30)
    bathrooms: float = Field(ge=0, le=20, multiple_of=0.5)
    amenities: list[str] = Field(default_factory=list, max_length=30, description="Amenity codes")
    image_urls: list[str] = Field(min_length=1, max_length=MAX_IMAGES, description="https URLs; first is the cover")

    @field_validator("image_urls")
    @classmethod
    def check_image_urls(cls, urls: list[str]) -> list[str]:
        cleaned = [u.strip() for u in urls if u.strip()]
        if not cleaned:
            raise ValueError("add at least one photo URL")
        for url in cleaned:
            if not url.startswith("https://") or len(url) > 500 or any(c.isspace() for c in url):
                raise ValueError("photo URLs must be https:// links without spaces (max 500 characters)")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("photo URLs must be unique")
        return cleaned

    @field_validator("amenities")
    @classmethod
    def dedupe_amenities(cls, codes: list[str]) -> list[str]:
        return list(dict.fromkeys(c.strip() for c in codes if c.strip()))


class HostListingDetail(ListingInput):
    model_config = ConfigDict(extra="ignore")

    id: int


class HostListingSummary(BaseModel):
    id: int
    title: str
    city: str
    state: str
    property_type: PropertyType
    nightly_price: int
    currency: str
    max_guests: int
    image_url: str | None
    upcoming_bookings: int
    created_at: datetime
