from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.users.deps import CurrentUser

router = APIRouter(tags=["users"])


class DemoUser(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    is_host: bool
    is_superhost: bool
    joined_at: datetime

    @classmethod
    def of(cls, user: User) -> "DemoUser":
        return cls(
            id=user.id,
            name=user.name,
            avatar_url=user.avatar_url,
            is_host=user.is_host,
            is_superhost=user.is_superhost,
            joined_at=user.created_at,
        )


@router.get("/users/demo", response_model=list[DemoUser])
def list_demo_users(db: Annotated[Session, Depends(get_db)]) -> list[DemoUser]:
    """Seeded personas for the demo user switcher (hosts first)."""
    users = db.scalars(select(User).order_by(User.is_host.desc(), User.id)).all()
    return [DemoUser.of(u) for u in users]


@router.get("/me", response_model=DemoUser)
def get_me(user: CurrentUser) -> DemoUser:
    return DemoUser.of(user)
