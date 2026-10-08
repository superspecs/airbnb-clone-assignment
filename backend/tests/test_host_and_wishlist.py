from app.bootstrap import create_tables, seed_if_empty
from tests.conftest import GUEST_PRIYA, GUEST_SANA, HOST_LEELA, HOST_VIKRAM, as_user, day, listing_payload


def test_host_routes_require_host_role(client):
    assert client.get("/api/v1/host/listings").status_code == 401
    res = client.get("/api/v1/host/listings", headers=as_user(GUEST_PRIYA))
    assert res.status_code == 403 and res.json()["error"]["code"] == "HOST_ONLY"


def test_create_update_and_delete_listing(client):
    created = client.post("/api/v1/host/listings", json=listing_payload(), headers=as_user(HOST_VIKRAM))
    assert created.status_code == 201, created.text
    listing_id = created.json()["id"]

    # Persisted and publicly searchable.
    search = client.get("/api/v1/listings?location=Testpur").json()
    assert [i["id"] for i in search["items"]] == [listing_id]
    detail = client.get(f"/api/v1/listings/{listing_id}").json()
    assert detail["host"]["id"] == HOST_VIKRAM
    assert {a["code"] for a in detail["amenities"]} == {"wifi", "kitchen"}

    # Only the owner can edit.
    other = client.put(f"/api/v1/host/listings/{listing_id}", json=listing_payload(), headers=as_user(HOST_LEELA))
    assert other.status_code == 403
    updated = client.put(
        f"/api/v1/host/listings/{listing_id}",
        json=listing_payload(
            title="Renamed test cottage",
            nightly_price=500000,
            image_urls=[
                "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            ],
        ),
        headers=as_user(HOST_VIKRAM),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["title"] == "Renamed test cottage"
    assert len(client.get(f"/api/v1/listings/{listing_id}").json()["images"]) == 2

    # Delete is blocked while an upcoming booking exists, then allowed after cancellation.
    booking_id = client.post(
        "/api/v1/bookings",
        json={"listing_id": listing_id, "check_in": day(20), "check_out": day(22), "guests": 2},
        headers=as_user(GUEST_PRIYA),
    ).json()["id"]
    blocked = client.delete(f"/api/v1/host/listings/{listing_id}", headers=as_user(HOST_VIKRAM))
    assert blocked.status_code == 409 and blocked.json()["error"]["code"] == "HAS_UPCOMING_BOOKINGS"

    host_bookings = client.get("/api/v1/host/bookings", headers=as_user(HOST_VIKRAM)).json()
    assert booking_id in [b["id"] for b in host_bookings]

    client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=as_user(GUEST_PRIYA))
    assert client.delete(f"/api/v1/host/listings/{listing_id}", headers=as_user(HOST_VIKRAM)).status_code == 204
    assert client.get(f"/api/v1/listings/{listing_id}").status_code == 404
    assert client.get("/api/v1/listings?location=Testpur").json()["total"] == 0
    # The guest's trip history survives the soft delete.
    trip = client.get(f"/api/v1/bookings/{booking_id}", headers=as_user(GUEST_PRIYA)).json()
    assert trip["listing"]["is_active"] is False


def test_listing_validation(client):
    headers = as_user(HOST_VIKRAM)
    insecure = client.post("/api/v1/host/listings", json=listing_payload(image_urls=["http://example.com/a.jpg"]), headers=headers)
    assert insecure.status_code == 422
    unknown = client.post("/api/v1/host/listings", json=listing_payload(amenities=["teleporter"]), headers=headers)
    assert unknown.status_code == 422 and unknown.json()["error"]["code"] == "UNKNOWN_AMENITY"
    too_cheap = client.post("/api/v1/host/listings", json=listing_payload(nightly_price=0), headers=headers)
    assert too_cheap.status_code == 422


def test_wishlist_is_idempotent_and_persisted(client):
    headers = as_user(GUEST_SANA)
    assert client.get("/api/v1/me/wishlist").status_code == 401
    assert client.put("/api/v1/me/wishlist/5", headers=headers).json() == {"listing_id": 5, "saved": True}
    assert client.put("/api/v1/me/wishlist/5", headers=headers).status_code == 200
    assert client.get("/api/v1/me/wishlist", headers=headers).json()["listing_ids"] == [5]
    assert client.delete("/api/v1/me/wishlist/5", headers=headers).json()["saved"] is False
    assert client.get("/api/v1/me/wishlist", headers=headers).json()["listing_ids"] == []
    assert client.put("/api/v1/me/wishlist/9999", headers=headers).status_code == 404


def test_startup_seeding_never_overwrites_existing_data(client):
    booking = client.post(
        "/api/v1/bookings",
        json={"listing_id": 2, "check_in": day(30), "check_out": day(31), "guests": 1},
        headers=as_user(GUEST_PRIYA),
    ).json()
    # Simulate an app restart: tables already exist and listings are present.
    create_tables()
    assert seed_if_empty() is False
    trips = client.get("/api/v1/me/trips", headers=as_user(GUEST_PRIYA)).json()
    assert booking["id"] in [t["id"] for t in trips]


def test_demo_users_and_meta(client):
    users = client.get("/api/v1/users/demo").json()
    assert sum(u["is_host"] for u in users) == 5 and len(users) == 13
    assert client.get("/api/v1/me", headers=as_user(HOST_LEELA)).json()["is_host"] is True
    assert {"wifi", "pool"} <= {a["code"] for a in client.get("/api/v1/meta/amenities").json()}
