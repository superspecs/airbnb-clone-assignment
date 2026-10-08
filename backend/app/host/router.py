from typing import Annotated

from fastapi import APIRouter, Depends, Path, Response
from sqlalchemy.orm import Session

from app.bookings import service as bookings_service
from app.bookings.schemas import BookingOut
from app.db import get_db
from app.host import schemas, service
from app.users.deps import CurrentHost

router = APIRouter(prefix="/host", tags=["host"])

DbSession = Annotated[Session, Depends(get_db)]
ListingId = Annotated[int, Path(ge=1)]


@router.get("/listings", response_model=list[schemas.HostListingSummary])
def list_listings(db: DbSession, host: CurrentHost) -> list[schemas.HostListingSummary]:
    return service.list_listings(db, host)


@router.post("/listings", response_model=schemas.HostListingDetail, status_code=201)
def create_listing(data: schemas.ListingInput, db: DbSession, host: CurrentHost) -> schemas.HostListingDetail:
    return service.create_listing(db, host, data)


@router.get("/listings/{listing_id}", response_model=schemas.HostListingDetail)
def get_listing(listing_id: ListingId, db: DbSession, host: CurrentHost) -> schemas.HostListingDetail:
    return service.get_listing(db, host, listing_id)


@router.put("/listings/{listing_id}", response_model=schemas.HostListingDetail)
def update_listing(
    listing_id: ListingId, data: schemas.ListingInput, db: DbSession, host: CurrentHost
) -> schemas.HostListingDetail:
    return service.update_listing(db, host, listing_id, data)


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(listing_id: ListingId, db: DbSession, host: CurrentHost) -> Response:
    service.delete_listing(db, host, listing_id)
    return Response(status_code=204)


@router.get("/bookings", response_model=list[BookingOut])
def host_bookings(db: DbSession, host: CurrentHost) -> list[BookingOut]:
    return bookings_service.host_bookings(db, host)
