"use client";

import { useRef, useTransition } from "react";

import { cancelTrip } from "@/app/actions";
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
  const close = () => dialogRef.current?.close();

  function confirm() {
    close();
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
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={`cancel-title-${bookingId}`}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <h2 id={`cancel-title-${bookingId}`} className={styles.dialogTitle}>
          Cancel this reservation?
        </h2>
        <p className={styles.dialogDates}>{dates}</p>
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
        <div className={styles.dialogActions}>
          <button type="button" className={styles.keep} onClick={close} autoFocus>
            Keep reservation
          </button>
          <button type="button" className={styles.cancel} onClick={confirm}>
            Cancel reservation
          </button>
        </div>
      </dialog>
    </>
  );
}
