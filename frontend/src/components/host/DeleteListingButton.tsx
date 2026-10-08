"use client";

import { useTransition } from "react";

import { removeHostListing } from "@/app/actions";
import { toast } from "@/components/ui/Toast";

import styles from "./Host.module.css";

export function DeleteListingButton({ listingId, title }: { listingId: number; title: string }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete “${title}”? It will disappear from search. Past guests keep their trip history.`)) return;
    startTransition(async () => {
      const result = await removeHostListing(listingId);
      toast(result.ok ? "Listing deleted." : result.error, result.ok ? "success" : "error");
    });
  }

  return (
    <button type="button" className={styles.danger} onClick={remove} disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
