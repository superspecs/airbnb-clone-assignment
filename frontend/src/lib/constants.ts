import type { Category, PropertyType, RoomType } from "@/lib/types/listing";

// Filter options mirror the backend enums and seeded amenity codes.
// TODO: load these from a /meta endpoint once the API exposes one.

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "beachfront", label: "Beachfront" },
  { value: "amazing_pools", label: "Amazing pools" },
  { value: "cabins", label: "Cabins" },
  { value: "mountain_views", label: "Mountain views" },
  { value: "city_stays", label: "City stays" },
  { value: "countryside", label: "Countryside" },
  { value: "lakefront", label: "Lakefront" },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "cabin", label: "Cabin" },
  { value: "cottage", label: "Cottage" },
];

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "entire_place", label: "Entire place" },
  { value: "private_room", label: "Private room" },
];

export const AMENITY_FILTERS: { code: string; label: string }[] = [
  { code: "wifi", label: "Wifi" },
  { code: "kitchen", label: "Kitchen" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "pool", label: "Pool" },
  { code: "free_parking", label: "Free parking" },
  { code: "washer", label: "Washing machine" },
  { code: "workspace", label: "Dedicated workspace" },
  { code: "hot_tub", label: "Hot tub" },
  { code: "fireplace", label: "Indoor fireplace" },
  { code: "pets_allowed", label: "Pets allowed" },
  { code: "beach_access", label: "Beach access" },
  { code: "tv", label: "TV" },
];

export const MAX_GUESTS = 16;
export const PAGE_SIZE = 24;
