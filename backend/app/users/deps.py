"""Mock authentication: the client names a seeded demo user in the X-Demo-User-Id header.

This is deliberately simple (the assignment allows mocked auth) and must not be used for
anything real: there are no passwords, sessions, or secrets.
"""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db import get_db
from app.models import User

DEMO_USER_HEADER = "X-Demo-User-Id"


def get_optional_user(
    db: Annotated[Session, Depends(get_db)],
    demo_user_id: Annotated[str | None, Header(alias=DEMO_USER_HEADER)] = None,
) -> User | None:
    if demo_user_id is None or demo_user_id.strip() == "":
        return None
    if not demo_user_id.strip().isdigit():
        raise AppError(401, "INVALID_USER", f"{DEMO_USER_HEADER} must be a demo user id.")
    user = db.get(User, int(demo_user_id))
    if user is None:
        raise AppError(401, "INVALID_USER", "That demo user does not exist.")
    return user


def require_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise AppError(401, "AUTH_REQUIRED", "Choose a demo user to continue.")
    return user


def require_host(user: Annotated[User, Depends(require_user)]) -> User:
    if not user.is_host:
        raise AppError(403, "HOST_ONLY", "Switch to a host account to manage listings.")
    return user


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(require_user)]
CurrentHost = Annotated[User, Depends(require_host)]
