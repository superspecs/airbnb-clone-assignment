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
