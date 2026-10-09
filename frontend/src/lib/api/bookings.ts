import { apiGet, apiRequest } from "@/lib/api/client";
import type { Booking, Quote, ReviewInput } from "@/lib/types/booking";
import type { Review } from "@/lib/types/listing";

export interface StayRequest {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export function getQuote(listingId: number, stay: StayRequest, userId?: number): Promise<Quote> {
  const params = new URLSearchParams({
    check_in: stay.checkIn,
    check_out: stay.checkOut,
    guests: String(stay.guests),
  });
  return apiGet<Quote>(`/listings/${listingId}/quote`, params, userId);
}

export function createBooking(listingId: number, stay: StayRequest, userId: number): Promise<Booking> {
  return apiRequest<Booking>("POST", "/bookings", {
    userId,
    body: { listing_id: listingId, check_in: stay.checkIn, check_out: stay.checkOut, guests: stay.guests },
  });
}

export function getTrips(userId: number): Promise<Booking[]> {
  return apiGet<Booking[]>("/me/trips", undefined, userId);
}

export function getBooking(bookingId: number, userId: number): Promise<Booking> {
  return apiGet<Booking>(`/bookings/${bookingId}`, undefined, userId);
}

export function cancelBooking(bookingId: number, userId: number): Promise<Booking> {
  return apiRequest<Booking>("POST", `/bookings/${bookingId}/cancel`, { userId });
}

export function submitReview(bookingId: number, review: ReviewInput, userId: number): Promise<Review> {
  return apiRequest<Review>("POST", `/bookings/${bookingId}/review`, { userId, body: review });
}
