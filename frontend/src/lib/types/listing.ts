// Mirrors backend/app/listings/schemas.py. Money values are integer minor units (paise).

export type PropertyType = "apartment" | "house" | "villa" | "cabin" | "cottage";
export type RoomType = "entire_place" | "private_room";
export type Category =
  | "beachfront"
  | "amazing_pools"
  | "cabins"
  | "mountain_views"
  | "city_stays"
  | "countryside"
  | "lakefront";

export interface ListingImage {
  url: string;
  alt: string;
}

export interface ListingCard {
  id: number;
  title: string;
  property_type: PropertyType;
  room_type: RoomType;
  category: Category;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  nightly_price: number;
  currency: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rating: number | null;
  review_count: number;
  is_superhost: boolean;
  images: ListingImage[];
}

export interface ListingSearchResponse {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Amenity {
  code: string;
  name: string;
  icon: string;
}

export interface Host {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  is_superhost: boolean;
  joined_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: { id: number; name: string; avatar_url: string | null };
}

export interface RatingSummary {
  average: number | null;
  count: number;
  distribution: { stars: number; count: number }[];
}

export interface ListingDetail extends ListingCard {
  description: string;
  address: string;
  cleaning_fee: number;
  amenities: Amenity[];
  host: Host;
  rating_summary: RatingSummary;
  reviews: Review[];
  created_at: string;
}

/** Confirmed stays; check_out is exclusive (free for the next check-in). */
export interface BlockedRange {
  check_in: string;
  check_out: string;
}

export interface Availability {
  listing_id: number;
  start: string;
  end: string;
  blocked: BlockedRange[];
}
