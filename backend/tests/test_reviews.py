import threading

from app.core.dates import today
from app.core.errors import AppError
from app.db import SessionLocal
from app.models import User
from app.reviews import service as reviews_service
from app.reviews.schemas import ReviewCreate
from tests.conftest import GUEST_PRIYA, GUEST_SANA, as_user, day

COMMENT = "Lovely stay, spotless rooms and a very helpful host."


def trips(client, user_id):
    return client.get("/api/v1/me/trips", headers=as_user(user_id)).json()


def unreviewed_completed_trip(client, user_id) -> dict:
    """A seeded stay that has ended and has no review yet."""
    done = [
        t for t in trips(client, user_id)
        if t["status"] == "confirmed" and t["check_out"] <= today().isoformat() and t["review"] is None
    ]
    assert done, "seed data should include a completed, unreviewed stay"
    return done[0]


def review(client, user_id, booking_id, rating=5, comment=COMMENT, **extra):
    return client.post(
        f"/api/v1/bookings/{booking_id}/review",
        json={"rating": rating, "comment": comment, **extra},
        headers=as_user(user_id),
    )


def test_guest_reviews_completed_stay_once(client):
    trip = unreviewed_completed_trip(client, GUEST_PRIYA)
    listing_id = trip["listing"]["id"]
    before = client.get(f"/api/v1/listings/{listing_id}").json()["rating_summary"]["count"]

    res = review(client, GUEST_PRIYA, trip["id"], rating=4, comment=f"  {COMMENT}  ")
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["rating"] == 4 and body["comment"] == COMMENT  # whitespace stripped
    assert body["author"]["id"] == GUEST_PRIYA

    # Persisted: shown on the booking and on the listing, and counted in its rating.
    booking = client.get(f"/api/v1/bookings/{trip['id']}", headers=as_user(GUEST_PRIYA)).json()
    assert booking["review"]["id"] == body["id"]
    detail = client.get(f"/api/v1/listings/{listing_id}").json()
    assert detail["rating_summary"]["count"] == before + 1
    assert detail["reviews"][0]["id"] == body["id"]  # newest first

    again = review(client, GUEST_PRIYA, trip["id"])
    assert again.status_code == 409 and again.json()["error"]["code"] == "ALREADY_REVIEWED"


def test_seeded_reviewed_stay_cannot_be_reviewed_again(client):
    reviewed = [t for t in trips(client, GUEST_PRIYA) if t["review"] is not None]
    assert reviewed
    res = review(client, GUEST_PRIYA, reviewed[0]["id"])
    assert res.status_code == 409 and res.json()["error"]["code"] == "ALREADY_REVIEWED"


def test_upcoming_and_cancelled_stays_cannot_be_reviewed(client):
    upcoming = client.post(
        "/api/v1/bookings",
        json={"listing_id": 2, "check_in": day(30), "check_out": day(32), "guests": 1},
        headers=as_user(GUEST_PRIYA),
    ).json()
    res = review(client, GUEST_PRIYA, upcoming["id"])
    assert res.status_code == 409 and res.json()["error"]["code"] == "STAY_NOT_COMPLETED"

    client.post(f"/api/v1/bookings/{upcoming['id']}/cancel", headers=as_user(GUEST_PRIYA))
    res = review(client, GUEST_PRIYA, upcoming["id"])
    assert res.status_code == 409 and res.json()["error"]["code"] == "BOOKING_CANCELLED"


def test_only_the_guest_can_review(client):
    trip = unreviewed_completed_trip(client, GUEST_PRIYA)
    assert review(client, GUEST_SANA, trip["id"]).status_code == 404  # stranger: not visible
    assert client.post(
        f"/api/v1/bookings/{trip['id']}/review", json={"rating": 5, "comment": COMMENT}
    ).status_code == 401
    host_id = client.get(f"/api/v1/listings/{trip['listing']['id']}").json()["host"]["id"]
    res = review(client, host_id, trip["id"])
    assert res.status_code == 403 and res.json()["error"]["code"] == "NOT_GUEST"
    assert review(client, GUEST_PRIYA, 9999).status_code == 404


def test_review_validation(client):
    trip = unreviewed_completed_trip(client, GUEST_PRIYA)
    for payload in (
        {"rating": 0, "comment": COMMENT},
        {"rating": 6, "comment": COMMENT},
        {"rating": 5, "comment": "  short   "},
        {"rating": 5, "comment": "x" * 1001},
        {"rating": 5, "comment": COMMENT, "listing_id": 1},  # unknown fields are rejected
    ):
        res = client.post(f"/api/v1/bookings/{trip['id']}/review", json=payload, headers=as_user(GUEST_PRIYA))
        assert res.status_code == 422, payload
        assert res.json()["error"]["code"] == "VALIDATION_ERROR"
    # Nothing was stored by the rejected attempts.
    assert review(client, GUEST_PRIYA, trip["id"]).status_code == 201


def test_removed_listing_cannot_be_reviewed(client):
    trip = unreviewed_completed_trip(client, GUEST_SANA)
    listing_id = trip["listing"]["id"]
    host_id = client.get(f"/api/v1/listings/{listing_id}").json()["host"]["id"]
    assert client.delete(f"/api/v1/host/listings/{listing_id}", headers=as_user(host_id)).status_code == 204
    res = review(client, GUEST_SANA, trip["id"])
    assert res.status_code == 409 and res.json()["error"]["code"] == "LISTING_REMOVED"


def test_concurrent_reviews_only_one_is_stored(client):
    booking_id = unreviewed_completed_trip(client, GUEST_PRIYA)["id"]
    payload = ReviewCreate(rating=5, comment=COMMENT)
    results: list[str] = []
    barrier = threading.Barrier(4)

    def attempt() -> None:
        with SessionLocal() as db:
            user = db.get(User, GUEST_PRIYA)
            barrier.wait()
            try:
                reviews_service.create_review(db, user, booking_id, payload)
                results.append("ok")
            except AppError as err:
                results.append(err.code)

    threads = [threading.Thread(target=attempt) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert results.count("ok") == 1
    assert results.count("ALREADY_REVIEWED") == 3


def test_host_sees_guest_review_on_reservation(client):
    trip = unreviewed_completed_trip(client, GUEST_PRIYA)
    host_id = client.get(f"/api/v1/listings/{trip['listing']['id']}").json()["host"]["id"]
    created = review(client, GUEST_PRIYA, trip["id"]).json()
    host_view = client.get(f"/api/v1/bookings/{trip['id']}", headers=as_user(host_id)).json()
    assert host_view["review"]["id"] == created["id"]
