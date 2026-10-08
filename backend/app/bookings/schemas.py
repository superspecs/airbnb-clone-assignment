from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import BookingStatus


class QuoteParams(BaseModel):
    check_in: date
    check_out: date = Field(description="Exclusive")
    guests: int = Field(ge=1, le=50)


class BookingCreate(BaseModel):
    """The client sends only what the guest chose. Prices are always computed server-side,
    so unknown fields such as a client-supplied total are rejected."""

    model_config = ConfigDict(extra="forbid")

    listing_id: int = Field(ge=1)
    check_in: date
    check_out: date = Field(description="Exclusive")
    guests: int = Field(ge=1, le=50)


class PriceOut(BaseModel):
    """All amounts in paise."""

    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int
    currency: str


class QuoteOut(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    price: PriceOut


class BookingListing(BaseModel):
    id: int
    title: str
    city: str
    state: str
    image_url: str | None
    host_name: str
    is_active: bool = Field(description="False once the host has deleted the listing")


class BookingGuest(BaseModel):
    id: int
    name: str


class BookingOut(BaseModel):
    id: int
    status: BookingStatus
    check_in: date
    check_out: date
    guests: int
    created_at: datetime
    price: PriceOut
    listing: BookingListing
    guest: BookingGuest
