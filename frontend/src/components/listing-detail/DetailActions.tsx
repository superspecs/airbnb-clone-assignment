"use client";

import { useState, useTransition } from "react";

import { toggleSaved } from "@/app/actions";
import { toast } from "@/components/ui/Toast";

import styles from "./DetailActions.module.css";

/** Share (copies the link) and Save (wishlist) buttons beside the listing title. */
export function DetailActions({ listingId, initiallySaved }: { listingId: number; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      toast("Link copied to clipboard.");
    } catch {
      toast("Couldn't copy the link.", "error");
    }
  }

  function save() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaved(listingId, next);
      if (result.ok) toast(next ? "Saved to your wishlist." : "Removed from your wishlist.");
      else {
        setSaved(!next);
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.action} onClick={share}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Share
      </button>
      <button type="button" className={styles.action} onClick={save} aria-pressed={saved} disabled={pending}>
        <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">
          <path
            d="M16 28c7-4.7 14-10 14-17a7 7 0 0 0-14-2.6A7 7 0 0 0 2 11c0 7 7 12.3 14 17z"
            fill={saved ? "var(--color-accent)" : "none"}
            stroke={saved ? "var(--color-accent)" : "currentColor"}
            strokeWidth="2.5"
          />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

/** Placeholder button for features the assignment allows to be mocked. */
export function ComingSoonButton({ label, message }: { label: string; message: string }) {
  return (
    <button type="button" className={styles.secondary} onClick={() => toast(message, "info")}>
      {label}
    </button>
  );
}
