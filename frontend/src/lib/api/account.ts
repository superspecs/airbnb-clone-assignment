import { apiGet, apiRequest } from "@/lib/api/client";
import type { ListingCard } from "@/lib/types/listing";
import type { DemoUser } from "@/lib/types/user";

export function getDemoUsers(): Promise<DemoUser[]> {
  return apiGet<DemoUser[]>("/users/demo");
}

export interface Wishlist {
  listing_ids: number[];
  items: ListingCard[];
}

export function getWishlist(userId: number): Promise<Wishlist> {
  return apiGet<Wishlist>("/me/wishlist", undefined, userId);
}

export function setSaved(listingId: number, saved: boolean, userId: number): Promise<{ saved: boolean }> {
  return apiRequest(saved ? "PUT" : "DELETE", `/me/wishlist/${listingId}`, { userId });
}
