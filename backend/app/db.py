from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.resolved_database_url,
    # FastAPI may run sync endpoints in a thread pool; SQLite connections must allow that.
    # `timeout` makes a writer wait for the lock instead of failing immediately.
    connect_args={"check_same_thread": False, "timeout": 15},
)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    # SQLite does not enforce foreign keys unless enabled per connection.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def begin_immediate(db: Session) -> None:
    """Start the session's transaction with SQLite's write lock held (BEGIN IMMEDIATE).

    Must be the first statement in the session's transaction. Concurrent writers then queue
    on the lock, so a read-check-insert sequence (e.g. booking overlap check) cannot interleave.
    """
    db.connection().exec_driver_sql("BEGIN IMMEDIATE")


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for ORM models."""


def get_db() -> Iterator[Session]:
    """FastAPI dependency that yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
