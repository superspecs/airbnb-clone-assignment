from typing import Annotated

from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from app.db import get_db
from app.listings.schemas import ListingCard
from app.listings.service import get_active_listing, listing_cards
from app.models import WishlistItem
from app.users.deps import CurrentUser

router = APIRouter(prefix="/me/wishlist", tags=["wishlist"])

DbSession = Annotated[Session, Depends(get_db)]
ListingId = Annotated[int, Path(ge=1)]


class WishlistOut(BaseModel):
    listing_ids: list[int]
    items: list[ListingCard]


class WishlistToggleOut(BaseModel):
    listing_id: int
    saved: bool


@router.get("", response_model=WishlistOut)
def get_wishlist(db: DbSession, user: CurrentUser) -> WishlistOut:
    ids = list(
        db.scalars(
            select(WishlistItem.listing_id)
            .where(WishlistItem.user_id == user.id)
            .order_by(WishlistItem.created_at.desc())
        )
    )
    items = listing_cards(db, ids)  # soft-deleted listings drop out here
    return WishlistOut(listing_ids=[card.id for card in items], items=items)


@router.put("/{listing_id}", response_model=WishlistToggleOut)
def save_listing(listing_id: ListingId, db: DbSession, user: CurrentUser) -> WishlistToggleOut:
    get_active_listing(db, listing_id)
    # Idempotent: saving twice is not an error.
    db.execute(insert(WishlistItem).values(user_id=user.id, listing_id=listing_id).on_conflict_do_nothing())
    db.commit()
    return WishlistToggleOut(listing_id=listing_id, saved=True)


@router.delete("/{listing_id}", response_model=WishlistToggleOut)
def remove_listing(listing_id: ListingId, db: DbSession, user: CurrentUser) -> WishlistToggleOut:
    db.execute(delete(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.listing_id == listing_id))
    db.commit()
    return WishlistToggleOut(listing_id=listing_id, saved=False)
