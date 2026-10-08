"use client";

import { useTransition } from "react";

import { cancelTrip } from "@/app/actions";
import { toast } from "@/components/ui/Toast";

import styles from "./page.module.css";

export function CancelTripButton({ bookingId }: { bookingId: number }) {
  const [pending, startTransition] = useTransition();

  function cancel() {
    if (!window.confirm("Cancel this reservation? The dates will become available to other guests.")) return;
    startTransition(async () => {
      const result = await cancelTrip(bookingId);
      toast(result.ok ? "Reservation cancelled." : result.error, result.ok ? "success" : "error");
    });
  }

  return (
    <button type="button" className={styles.cancel} onClick={cancel} disabled={pending}>
      {pending ? "Cancelling…" : "Cancel reservation"}
    </button>
  );
}
