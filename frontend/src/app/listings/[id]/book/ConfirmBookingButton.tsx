"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { confirmBooking } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import type { StayRequest } from "@/lib/api/bookings";

import styles from "./page.module.css";

export function ConfirmBookingButton({ listingId, stay }: { listingId: number; stay: StayRequest }) {
  const [error, setError] = useState<string | null>(null);
  // Someone else booked these dates meanwhile: retrying can't succeed, so offer new dates instead.
  const [taken, setTaken] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the confirmation page.
      const result = await confirmBooking(listingId, stay);
      if (result && !result.ok) {
        setError(result.error);
        setTaken(result.code === "DATES_UNAVAILABLE");
        toast(result.error, "error");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
          {taken && <> Someone else just booked them.</>}
        </p>
      )}
      {taken ? (
        <Link href={`/listings/${listingId}?guests=${stay.guests}`} className={styles.confirm}>
          Choose new dates
        </Link>
      ) : (
        <button type="button" className={styles.confirm} onClick={confirm} disabled={pending}>
          {pending ? "Confirming…" : "Confirm booking (demo)"}
        </button>
      )}
    </div>
  );
}
