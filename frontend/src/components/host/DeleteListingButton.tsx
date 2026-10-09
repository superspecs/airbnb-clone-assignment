"use client";

import { useRef, useTransition } from "react";

import { removeHostListing } from "@/app/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { pluralize } from "@/lib/format";

import styles from "./Host.module.css";

interface DeleteListingButtonProps {
  listingId: number;
  title: string;
  /** Listings with upcoming reservations can't be deleted (the API refuses); say so up front. */
  upcomingBookings: number;
}

export function DeleteListingButton({ listingId, title, upcomingBookings }: DeleteListingButtonProps) {
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const blocked = upcomingBookings > 0;

  function remove() {
    startTransition(async () => {
      const result = await removeHostListing(listingId);
      toast(result.ok ? "Listing deleted." : result.error, result.ok ? "success" : "error");
    });
  }

  return (
    <>
      <button type="button" className={styles.danger} onClick={() => dialogRef.current?.showModal()} disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      <ConfirmDialog
        dialogRef={dialogRef}
        id={`delete-${listingId}`}
        title={blocked ? "This listing can't be deleted yet" : "Delete this listing?"}
        subtitle={title}
        dismissLabel={blocked ? "OK" : "Keep listing"}
        confirmLabel={blocked ? undefined : "Delete listing"}
        onConfirm={blocked ? undefined : remove}
      >
        <p className={styles.dialogText}>
          {blocked
            ? `It has ${pluralize(upcomingBookings, "upcoming reservation")}. Cancel ${upcomingBookings === 1 ? "it" : "them"} from your reservations first, or wait until ${upcomingBookings === 1 ? "it has" : "they have"} finished.`
            : "It will disappear from search and can't be booked. Past guests keep their trip history."}
        </p>
      </ConfirmDialog>
    </>
  );
}
