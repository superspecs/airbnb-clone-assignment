from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Enum


def utcnow() -> datetime:
    return datetime.now(UTC)


def str_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    """Store a StrEnum as its value in a VARCHAR column guarded by a CHECK constraint."""
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        validate_strings=True,
        length=32,
        values_callable=lambda members: [m.value for m in members],
    )
