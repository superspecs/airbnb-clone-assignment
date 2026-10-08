from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.listings import schemas, service

router = APIRouter(prefix="/listings", tags=["listings"])

DbSession = Annotated[Session, Depends(get_db)]
ListingId = Annotated[int, Path(ge=1)]


@router.get("", response_model=schemas.ListingSearchResponse)
def search_listings(
    params: Annotated[schemas.ListingSearchParams, Query()], db: DbSession
) -> schemas.ListingSearchResponse:
    return service.search_listings(db, params)


@router.get("/{listing_id}", response_model=schemas.ListingDetail)
def get_listing(listing_id: ListingId, db: DbSession) -> schemas.ListingDetail:
    return service.get_listing_detail(db, listing_id)


@router.get("/{listing_id}/availability", response_model=schemas.AvailabilityResponse)
def get_availability(
    listing_id: ListingId,
    db: DbSession,
    start: Annotated[date | None, Query(alias="from", description="Defaults to today")] = None,
    end: Annotated[date | None, Query(alias="to", description="Exclusive; defaults to from + 365 days")] = None,
) -> schemas.AvailabilityResponse:
    return service.get_availability(db, listing_id, start, end)
