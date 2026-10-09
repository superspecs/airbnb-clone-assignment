from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.db import get_db
from app.listings.schemas import ReviewOut
from app.reviews import schemas, service
from app.users.deps import CurrentUser

router = APIRouter(tags=["reviews"])

DbSession = Annotated[Session, Depends(get_db)]
PositiveId = Annotated[int, Path(ge=1)]


@router.post("/bookings/{booking_id}/review", response_model=ReviewOut, status_code=201)
def create_review(
    booking_id: PositiveId, payload: schemas.ReviewCreate, db: DbSession, user: CurrentUser
) -> ReviewOut:
    """Review a completed stay (guest only, once per booking)."""
    return service.create_review(db, user, booking_id, payload)
