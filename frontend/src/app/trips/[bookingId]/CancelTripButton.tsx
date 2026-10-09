"use client";

import { useRef, useTransition } from "react";

import { cancelTrip } from "@/app/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

import styles from "./page.module.css";

interface CancelTripButtonProps {
  bookingId: number;
  /** Guest total, formatted; cancellation before check-in refunds all of it (simulated). */
  refund: string;
  dates: string;
  /** The listing's host is cancelling on the guest's behalf. */
  asHost?: boolean;
}

/** Cancel button plus a confirmation dialog that states the terms and the (demo) refund. */
export function CancelTripButton({ bookingId, refund, dates, asHost = false }: CancelTripButtonProps) {
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  function cancel() {
    startTransition(async () => {
      const result = await cancelTrip(bookingId);
      toast(result.ok ? "Reservation cancelled. The dates are available again." : result.error, result.ok ? "success" : "error");
    });
  }

  return (
    <>
      <button type="button" className={styles.cancel} onClick={() => dialogRef.current?.showModal()} disabled={pending}>
        {pending ? "Cancelling…" : "Cancel reservation"}
      </button>
      <ConfirmDialog
        dialogRef={dialogRef}
        id={`cancel-${bookingId}`}
        title="Cancel this reservation?"
        subtitle={dates}
        dismissLabel="Keep reservation"
        confirmLabel="Cancel reservation"
        onConfirm={cancel}
      >
        <dl className={styles.terms}>
          <div>
            <dt>Cancellation policy</dt>
            <dd>Free cancellation any time before check-in.</dd>
          </div>
          <div>
            <dt>{asHost ? "Refund to the guest" : "Your refund"}</dt>
            <dd>
              <strong>{refund}</strong> (full amount, simulated: no money moves in this demo)
            </dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>The dates become available to other guests immediately.</dd>
          </div>
        </dl>
      </ConfirmDialog>
    </>
  );
}
