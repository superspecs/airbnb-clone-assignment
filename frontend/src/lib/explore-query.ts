import { AMENITY_FILTERS, CATEGORIES, MAX_GUESTS, PAGE_SIZE, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/constants";
import type { Category, PropertyType, RoomType } from "@/lib/types/listing";

/**
 * Explore state lives in the URL. Prices in the URL are whole rupees for readability;
 * they are converted to paise only when calling the API.
 */
export interface ExploreQuery {
  location?: string;
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD, exclusive
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes: PropertyType[];
  roomType?: RoomType;
  category?: Category;
  amenities: string[];
  minBedrooms?: number;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const all = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

function nonNegativeInt(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly { value: T }[]): T | undefined {
  return allowed.find((option) => option.value === value)?.value;
}

const isoDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);

/** Parse untrusted URL params; unknown or malformed values are dropped. */
export function parseExploreQuery(raw: RawParams): ExploreQuery {
  const guests = nonNegativeInt(first(raw.guests));
  const knownAmenities = new Set(AMENITY_FILTERS.map((a) => a.code));
  return {
    location: first(raw.location)?.trim() || undefined,
    checkIn: isoDate(first(raw.check_in)),
    checkOut: isoDate(first(raw.check_out)),
    guests: guests && guests >= 1 ? Math.min(guests, MAX_GUESTS) : undefined,
    minPrice: nonNegativeInt(first(raw.min_price)),
    maxPrice: nonNegativeInt(first(raw.max_price)),
    propertyTypes: [
      ...new Set(all(raw.property_type).flatMap((v) => oneOf(v, PROPERTY_TYPES) ?? [])),
    ],
    roomType: oneOf(first(raw.room_type), ROOM_TYPES),
    category: oneOf(first(raw.category), CATEGORIES),
    amenities: [...new Set(all(raw.amenities).filter((code) => knownAmenities.has(code)))],
    minBedrooms: nonNegativeInt(first(raw.min_bedrooms)),
    page: Math.max(1, nonNegativeInt(first(raw.page)) ?? 1),
  };
}

/** URL search params for the Explore page itself (rupee prices). */
export function toUrlParams(query: ExploreQuery): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  };
  set("location", query.location);
  set("check_in", query.checkIn);
  set("check_out", query.checkOut);
  set("guests", query.guests);
  set("min_price", query.minPrice);
  set("max_price", query.maxPrice);
  query.propertyTypes.forEach((t) => params.append("property_type", t));
  set("room_type", query.roomType);
  set("category", query.category);
  query.amenities.forEach((a) => params.append("amenities", a));
  set("min_bedrooms", query.minBedrooms);
  if (query.page > 1) set("page", query.page);
  return params;
}

export function exploreHref(query: ExploreQuery, overrides: Partial<ExploreQuery> = {}): string {
  const params = toUrlParams({ ...query, ...overrides });
  return params.size > 0 ? `/?${params}` : "/";
}

/** Search params for GET /api/v1/listings (paise prices, fixed page size). */
export function toApiParams(query: ExploreQuery): URLSearchParams {
  const params = toUrlParams({ ...query, page: 1 });
  if (query.minPrice !== undefined) params.set("min_price", String(query.minPrice * 100));
  if (query.maxPrice !== undefined) params.set("max_price", String(query.maxPrice * 100));
  params.set("page", String(query.page));
  params.set("page_size", String(PAGE_SIZE));
  return params;
}

/** Number of active filters shown on the Filters button (category and search fields excluded). */
export function activeFilterCount(query: ExploreQuery): number {
  return (
    (query.roomType ? 1 : 0) +
    (query.minPrice !== undefined || query.maxPrice !== undefined ? 1 : 0) +
    (query.minBedrooms ? 1 : 0) +
    query.propertyTypes.length +
    query.amenities.length
  );
}
