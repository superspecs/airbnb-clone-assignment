import { apiGet } from "@/lib/api/client";
import { type ExploreQuery, toApiParams } from "@/lib/explore-query";
import type { Availability, ListingDetail, ListingSearchResponse } from "@/lib/types/listing";

export function searchListings(query: ExploreQuery): Promise<ListingSearchResponse> {
  return apiGet<ListingSearchResponse>("/listings", toApiParams(query));
}

export function getListing(id: number): Promise<ListingDetail> {
  return apiGet<ListingDetail>(`/listings/${id}`);
}

/** Confirmed booked ranges for roughly the next year. */
export function getAvailability(id: number): Promise<Availability> {
  return apiGet<Availability>(`/listings/${id}/availability`);
}
