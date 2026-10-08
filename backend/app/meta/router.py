from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.listings.schemas import AmenityOut
from app.models import Amenity

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: Annotated[Session, Depends(get_db)]) -> list[AmenityOut]:
    amenities = db.scalars(select(Amenity).order_by(Amenity.name)).all()
    return [AmenityOut(code=a.code, name=a.name, icon=a.icon) for a in amenities]
