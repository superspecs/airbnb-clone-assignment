import { apiGet, apiRequest } from "@/lib/api/client";
import type { Booking } from "@/lib/types/booking";
import type { HostListingDetail, HostListingSummary, ListingInput } from "@/lib/types/host";
import type { Amenity } from "@/lib/types/listing";

export function getHostListings(userId: number): Promise<HostListingSummary[]> {
  return apiGet<HostListingSummary[]>("/host/listings", undefined, userId);
}

export function getHostListing(listingId: number, userId: number): Promise<HostListingDetail> {
  return apiGet<HostListingDetail>(`/host/listings/${listingId}`, undefined, userId);
}

export function getHostBookings(userId: number): Promise<Booking[]> {
  return apiGet<Booking[]>("/host/bookings", undefined, userId);
}

export function createHostListing(data: ListingInput, userId: number): Promise<HostListingDetail> {
  return apiRequest<HostListingDetail>("POST", "/host/listings", { body: data, userId });
}

export function updateHostListing(listingId: number, data: ListingInput, userId: number): Promise<HostListingDetail> {
  return apiRequest<HostListingDetail>("PUT", `/host/listings/${listingId}`, { body: data, userId });
}

export function deleteHostListing(listingId: number, userId: number): Promise<void> {
  return apiRequest<void>("DELETE", `/host/listings/${listingId}`, { userId });
}

export function getAmenities(): Promise<Amenity[]> {
  return apiGet<Amenity[]>("/meta/amenities");
}
