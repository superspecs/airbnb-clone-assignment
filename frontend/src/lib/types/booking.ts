// Mirrors backend/app/bookings/schemas.py. Money values are integer paise.

import type { Review } from "@/lib/types/listing";

export interface Price {
  nights: number;
  nightly_price: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  currency: string;
}

export interface Quote {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  price: Price;
}

export interface Booking {
  id: number;
  status: "confirmed" | "cancelled";
  check_in: string;
  check_out: string;
  guests: number;
  created_at: string;
  price: Price;
  listing: {
    id: number;
    title: string;
    city: string;
    state: string;
    image_url: string | null;
    host_name: string;
    is_active: boolean;
  };
  guest: { id: number; name: string };
  /** The guest's review of this stay, once written. */
  review: Review | null;
}

/** Mirrors backend ReviewCreate. */
export interface ReviewInput {
  rating: number;
  comment: string;
}

/** Comment length limits enforced by the API. */
export const REVIEW_COMMENT_MIN = 10;
export const REVIEW_COMMENT_MAX = 1000;
