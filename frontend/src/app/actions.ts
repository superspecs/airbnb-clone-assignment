"use server";

// Server actions: every mutation runs on the Next.js server, which forwards the demo user id
// to the API. The browser never talks to the API directly for writes.

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { setSaved } from "@/lib/api/account";
import { cancelBooking, createBooking, getQuote, type StayRequest } from "@/lib/api/bookings";
import { errorMessage } from "@/lib/api/client";
import { createHostListing, deleteHostListing, updateHostListing } from "@/lib/api/host";
import { DEMO_USER_COOKIE, getCurrentUserId } from "@/lib/session";
import type { Quote } from "@/lib/types/booking";
import type { ListingInput } from "@/lib/types/host";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function switchDemoUser(userId: number): Promise<void> {
  if (!Number.isInteger(userId) || userId < 1) return;
  (await cookies()).set(DEMO_USER_COOKIE, String(userId), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  refresh();
}

export async function quoteStay(listingId: number, stay: StayRequest): Promise<ActionResult<Quote>> {
  try {
    return { ok: true, data: await getQuote(listingId, stay, await getCurrentUserId()) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function confirmBooking(listingId: number, stay: StayRequest): Promise<ActionResult> {
  let bookingId: number;
  try {
    bookingId = (await createBooking(listingId, stay, await getCurrentUserId())).id;
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  redirect(`/trips/${bookingId}?toast=booked`);
}

export async function cancelTrip(bookingId: number): Promise<ActionResult> {
  try {
    await cancelBooking(bookingId, await getCurrentUserId());
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  refresh();
  return { ok: true, data: undefined };
}

export async function toggleSaved(listingId: number, saved: boolean): Promise<ActionResult> {
  try {
    await setSaved(listingId, saved, await getCurrentUserId());
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function saveHostListing(listingId: number | null, data: ListingInput): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    if (listingId === null) await createHostListing(data, userId);
    else await updateHostListing(listingId, data, userId);
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  redirect(`/host?toast=${listingId === null ? "listing-created" : "listing-updated"}`);
}

export async function removeHostListing(listingId: number): Promise<ActionResult> {
  try {
    await deleteHostListing(listingId, await getCurrentUserId());
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  refresh();
  return { ok: true, data: undefined };
}
