"use client";

import { useState, useTransition } from "react";

import { confirmBooking } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import type { StayRequest } from "@/lib/api/bookings";

import styles from "./page.module.css";

export function ConfirmBookingButton({ listingId, stay }: { listingId: number; stay: StayRequest }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the confirmation page.
      const result = await confirmBooking(listingId, stay);
      if (result && !result.ok) {
        setError(result.error);
        toast(result.error, "error");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="button" className={styles.confirm} onClick={confirm} disabled={pending}>
        {pending ? "Confirming…" : "Confirm booking (demo)"}
      </button>
    </div>
  );
}
