import { apiGet } from "@/lib/api/client";
import { type ExploreQuery, toApiParams } from "@/lib/explore-query";
import type { ListingSearchResponse } from "@/lib/types/listing";

export function searchListings(query: ExploreQuery): Promise<ListingSearchResponse> {
  return apiGet<ListingSearchResponse>("/listings", toApiParams(query));
}
