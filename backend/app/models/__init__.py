"""ORM models. Importing this package registers every table on `Base.metadata`."""

from app.models.amenity import Amenity, listing_amenities
from app.models.booking import Booking, BookingStatus
from app.models.listing import Category, Listing, ListingImage, PropertyType, RoomType
from app.models.review import Review
from app.models.user import User
from app.models.wishlist import WishlistItem

__all__ = [
    "Amenity",
    "Booking",
    "BookingStatus",
    "Category",
    "Listing",
    "ListingImage",
    "PropertyType",
    "Review",
    "RoomType",
    "User",
    "WishlistItem",
    "listing_amenities",
]
