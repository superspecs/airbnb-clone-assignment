import type { Category, PropertyType, RoomType } from "@/lib/types/listing";

/** Mirrors backend ListingInput. Money in paise. */
export interface ListingInput {
  title: string;
  description: string;
  property_type: PropertyType;
  room_type: RoomType;
  category: Category;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  nightly_price: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  image_urls: string[];
}

export interface HostListingDetail extends ListingInput {
  id: number;
}

export interface HostListingSummary {
  id: number;
  title: string;
  city: string;
  state: string;
  property_type: PropertyType;
  nightly_price: number;
  currency: string;
  max_guests: number;
  image_url: string | null;
  upcoming_bookings: number;
  created_at: string;
}
