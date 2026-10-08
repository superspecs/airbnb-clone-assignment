"""Test setup: every test gets a freshly seeded SQLite database in a temp directory.

DATABASE_URL must be set before `app` is imported, because settings and the engine are
created at import time. The real backend/data/app.db is never touched.
"""

import os
import tempfile
from datetime import timedelta

_TMP_DIR = tempfile.mkdtemp(prefix="stays-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.db"
os.environ["SEED_ON_STARTUP"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.bootstrap import reset_database, seed_if_empty  # noqa: E402
from app.core.dates import today  # noqa: E402
from app.main import app  # noqa: E402

# Seed identities (see app/seed/data.py): users 1–5 are hosts, 6–13 are guests.
HOST_LEELA = 4  # owns listing 1 (max 2 guests; booked today+5→+8 and +8→+10)
HOST_VIKRAM = 5  # owns listing 2
GUEST_PRIYA = 6
GUEST_SANA = 7


@pytest.fixture()
def client() -> TestClient:
    reset_database()
    seed_if_empty()
    with TestClient(app) as test_client:
        yield test_client


def day(offset: int) -> str:
    return (today() + timedelta(days=offset)).isoformat()


def as_user(user_id: int) -> dict[str, str]:
    return {"X-Demo-User-Id": str(user_id)}


def listing_payload(**overrides) -> dict:
    payload = {
        "title": "Test cottage by the river",
        "description": "A quiet test cottage with a garden, used only by the automated tests.",
        "property_type": "cottage",
        "room_type": "entire_place",
        "category": "countryside",
        "address": "Riverside",
        "city": "Testpur",
        "state": "Karnataka",
        "country": "India",
        "latitude": 12.9,
        "longitude": 77.6,
        "nightly_price": 450000,
        "cleaning_fee": 50000,
        "max_guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "bathrooms": 1,
        "amenities": ["wifi", "kitchen"],
        "image_urls": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    }
    payload.update(overrides)
    return payload
