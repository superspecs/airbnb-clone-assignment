import threading
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.bookings import service as bookings_service
from app.bookings.schemas import BookingCreate
from app.core.errors import AppError
from app.db import SessionLocal
from app.models import Booking, BookingStatus, User
from tests.conftest import GUEST_PRIYA, GUEST_SANA, HOST_LEELA, as_user, day


def quote(client, listing_id, check_in, check_out, guests=2, headers=None):
    return client.get(
        f"/api/v1/listings/{listing_id}/quote",
        params={"check_in": check_in, "check_out": check_out, "guests": guests},
        headers=headers or {},
    )


def book(client, user_id, listing_id, check_in, check_out, guests=2, **extra):
    body = {"listing_id": listing_id, "check_in": check_in, "check_out": check_out, "guests": guests, **extra}
    return client.post("/api/v1/bookings", json=body, headers=as_user(user_id))


def test_quote_is_computed_server_side(client):
    res = quote(client, 2, day(20), day(23))
    assert res.status_code == 200
    price = res.json()["price"]
    # Listing 2: ₹14,500/night, ₹2,000 cleaning, 12% service fee (all in paise).
    assert price["nights"] == 3
    assert price["subtotal"] == 1_450_000 * 3
    assert price["cleaning_fee"] == 200_000
    assert price["service_fee"] == round(1_450_000 * 3 * 0.12)
    assert price["total"] == price["subtotal"] + price["cleaning_fee"] + price["service_fee"]


@pytest.mark.parametrize(
    ("check_in", "check_out", "guests", "status", "code"),
    [
        (day(-3), day(-1), 2, 422, "DATES_IN_PAST"),
        (day(10), day(10), 2, 422, "INVALID_DATES"),
        (day(12), day(10), 2, 422, "INVALID_DATES"),
        (day(20), day(21), 3, 422, "TOO_MANY_GUESTS"),  # listing 1 allows 2 guests
        (day(20), day(120), 2, 422, "STAY_TOO_LONG"),
        (day(6), day(7), 2, 409, "DATES_UNAVAILABLE"),  # inside the seeded +5→+8 stay
        (day(2), day(20), 2, 409, "DATES_UNAVAILABLE"),  # envelops seeded stays
    ],
)
def test_quote_validation(client, check_in, check_out, guests, status, code):
    res = quote(client, 1, check_in, check_out, guests)
    assert res.status_code == status
    assert res.json()["error"]["code"] == code


def test_checkout_day_is_exclusive(client):
    # Seeded stays on listing 1: +5→+8 and +8→+10. Touching ranges are allowed.
    assert quote(client, 1, day(3), day(5)).status_code == 200
    assert quote(client, 1, day(10), day(12)).status_code == 200
    # A cancelled seeded stay (+14→+17) does not block.
    assert quote(client, 1, day(14), day(17)).status_code == 200


def test_booking_persists_blocks_dates_and_appears_in_trips(client):
    quoted_total = quote(client, 2, day(30), day(33)).json()["price"]["total"]
    res = book(client, GUEST_PRIYA, 2, day(30), day(33))
    assert res.status_code == 201, res.text
    booking = res.json()
    assert booking["status"] == "confirmed"
    assert booking["price"]["total"] == quoted_total
    # Once booked, the same dates can no longer be quoted.
    assert quote(client, 2, day(30), day(33)).status_code == 409

    trips = client.get("/api/v1/me/trips", headers=as_user(GUEST_PRIYA)).json()
    assert booking["id"] in [t["id"] for t in trips]

    blocked = client.get(f"/api/v1/listings/2/availability?from={day(0)}&to={day(60)}").json()["blocked"]
    assert {"check_in": day(30), "check_out": day(33)} in blocked

    overlapping = book(client, GUEST_SANA, 2, day(32), day(35))
    assert overlapping.status_code == 409
    assert overlapping.json()["error"]["code"] == "DATES_UNAVAILABLE"

    # Search with those dates no longer returns the listing.
    ids = [i["id"] for i in client.get(f"/api/v1/listings?check_in={day(31)}&check_out={day(32)}&page_size=50").json()["items"]]
    assert 2 not in ids

    adjacent = book(client, GUEST_SANA, 2, day(33), day(35))
    assert adjacent.status_code == 201


def test_booking_requires_demo_user(client):
    res = client.post("/api/v1/bookings", json={"listing_id": 2, "check_in": day(30), "check_out": day(31), "guests": 1})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "AUTH_REQUIRED"
    bad = client.post(
        "/api/v1/bookings",
        json={"listing_id": 2, "check_in": day(30), "check_out": day(31), "guests": 1},
        headers={"X-Demo-User-Id": "9999"},
    )
    assert bad.status_code == 401


def test_client_supplied_total_is_rejected(client):
    res = book(client, GUEST_PRIYA, 2, day(30), day(31), total=1)
    assert res.status_code == 422


def test_host_cannot_book_own_listing(client):
    res = book(client, HOST_LEELA, 1, day(40), day(42))
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "OWN_LISTING"


def test_booking_visible_to_guest_and_host_only(client):
    booking_id = book(client, GUEST_PRIYA, 1, day(40), day(42)).json()["id"]
    assert client.get(f"/api/v1/bookings/{booking_id}", headers=as_user(GUEST_PRIYA)).status_code == 200
    assert client.get(f"/api/v1/bookings/{booking_id}", headers=as_user(HOST_LEELA)).status_code == 200
    assert client.get(f"/api/v1/bookings/{booking_id}", headers=as_user(GUEST_SANA)).status_code == 404


def test_cancel_frees_dates(client):
    booking_id = book(client, GUEST_PRIYA, 2, day(50), day(52)).json()["id"]
    assert client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=as_user(GUEST_SANA)).status_code == 404
    res = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=as_user(GUEST_PRIYA))
    assert res.status_code == 200 and res.json()["status"] == "cancelled"
    assert book(client, GUEST_SANA, 2, day(50), day(52)).status_code == 201


def test_database_trigger_rejects_overlap(client):
    with SessionLocal() as db:
        db.add(
            Booking(
                listing_id=1, guest_id=GUEST_PRIYA, check_in=date.fromisoformat(day(6)),
                check_out=date.fromisoformat(day(7)), guests=1, status=BookingStatus.CONFIRMED,
                nights=1, nightly_price=1, subtotal=1, cleaning_fee=0, service_fee=0, total=1,
            )
        )
        with pytest.raises(IntegrityError, match="BOOKING_OVERLAP"):
            db.commit()


def test_concurrent_bookings_only_one_wins(client):
    payload = BookingCreate(listing_id=3, check_in=day(60), check_out=day(63), guests=1)
    results: list[str] = []
    barrier = threading.Barrier(6)

    def attempt(user_id: int) -> None:
        with SessionLocal() as db:
            user = db.get(User, user_id)
            barrier.wait()
            try:
                bookings_service.create_booking(db, user, payload)
                results.append("ok")
            except AppError as err:
                results.append(err.code)

    threads = [threading.Thread(target=attempt, args=(uid,)) for uid in range(6, 12)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert results.count("ok") == 1
    assert results.count("DATES_UNAVAILABLE") == 5
