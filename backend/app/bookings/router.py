from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.bookings import schemas, service
from app.db import get_db
from app.users.deps import CurrentUser, OptionalUser

router = APIRouter(tags=["bookings"])

DbSession = Annotated[Session, Depends(get_db)]
PositiveId = Annotated[int, Path(ge=1)]


@router.get("/listings/{listing_id}/quote", response_model=schemas.QuoteOut)
def get_quote(
    listing_id: PositiveId,
    params: Annotated[schemas.QuoteParams, Query()],
    db: DbSession,
    user: OptionalUser,
) -> schemas.QuoteOut:
    """Validated price breakdown for a stay; 409 if the dates are taken."""
    return service.quote(db, listing_id, params, user)


@router.post("/bookings", response_model=schemas.BookingOut, status_code=201)
def create_booking(payload: schemas.BookingCreate, db: DbSession, user: CurrentUser) -> schemas.BookingOut:
    return service.create_booking(db, user, payload)


@router.get("/bookings/{booking_id}", response_model=schemas.BookingOut)
def get_booking(booking_id: PositiveId, db: DbSession, user: CurrentUser) -> schemas.BookingOut:
    return service.get_booking(db, user, booking_id)


@router.post("/bookings/{booking_id}/cancel", response_model=schemas.BookingOut)
def cancel_booking(booking_id: PositiveId, db: DbSession, user: CurrentUser) -> schemas.BookingOut:
    return service.cancel_booking(db, user, booking_id)


@router.get("/me/trips", response_model=list[schemas.BookingOut])
def my_trips(db: DbSession, user: CurrentUser) -> list[schemas.BookingOut]:
    return service.list_trips(db, user)
