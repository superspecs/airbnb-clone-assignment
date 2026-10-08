import { apiGet } from "@/lib/api/client";
import { type ExploreQuery, toApiParams } from "@/lib/explore-query";
import type { Availability, ListingDetail, ListingSearchResponse } from "@/lib/types/listing";

export function searchListings(query: ExploreQuery): Promise<ListingSearchResponse> {
  return apiGet<ListingSearchResponse>("/listings", toApiParams(query));
}

/** Every active listing in one page (the API caps page_size at 50); used for homepage sections. */
export function getAllListings(): Promise<ListingSearchResponse> {
  return apiGet<ListingSearchResponse>("/listings", new URLSearchParams({ page: "1", page_size: "50" }));
}

export function getListing(id: number): Promise<ListingDetail> {
  return apiGet<ListingDetail>(`/listings/${id}`);
}

/** Confirmed booked ranges for roughly the next year. */
export function getAvailability(id: number): Promise<Availability> {
  return apiGet<Availability>(`/listings/${id}/availability`);
}
