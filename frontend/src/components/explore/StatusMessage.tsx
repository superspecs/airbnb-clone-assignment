"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import styles from "./StatusMessage.module.css";

export function EmptyResults({ clearHref }: { clearHref: string }) {
  return (
    <div className={styles.box}>
      <h2 className={styles.title}>No stays match your search</h2>
      <p className={styles.text}>Try different dates, a broader location, or fewer filters.</p>
      <Link href={clearHref} className={styles.action}>
        Clear search and filters
      </Link>
    </div>
  );
}

export function ResultsError({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={styles.box} role="alert">
      <h2 className={styles.title}>We couldn&apos;t load stays</h2>
      <p className={styles.text}>{message}</p>
      <button
        type="button"
        className={styles.action}
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
