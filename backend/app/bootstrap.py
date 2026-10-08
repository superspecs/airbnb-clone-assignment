import logging

from sqlalchemy import select

import app.models  # noqa: F401  (registers all tables on Base.metadata)
from app.db import Base, SessionLocal, engine
from app.models import Listing
from app.models.booking import BOOKING_TRIGGERS
from app.seed.loader import load_seed_data

logger = logging.getLogger(__name__)


def create_tables() -> None:
    """Create missing tables and booking-overlap triggers. Never drops or alters existing data."""
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        for ddl in BOOKING_TRIGGERS:
            conn.exec_driver_sql(ddl)  # CREATE TRIGGER IF NOT EXISTS — idempotent


def reset_database() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


def seed_if_empty() -> bool:
    """Load seed data only when no listings exist. Returns True if data was loaded."""
    with SessionLocal() as db:
        if db.scalar(select(Listing.id).limit(1)) is not None:
            return False
        load_seed_data(db)
        db.commit()
    logger.info("Loaded seed data into an empty database.")
    return True
