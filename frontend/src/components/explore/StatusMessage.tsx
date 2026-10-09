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

export function ResultsError({ message, title = "We couldn't load stays" }: { message: string; title?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={styles.box} role="alert">
      <h2 className={styles.title}>{title}</h2>
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

/** Experiences and Services aren't part of this demo: say so plainly and point back to homes. */
export function SectionUnavailable({ label, homesHref }: { label: string; homesHref: string }) {
  return (
    <div className={styles.box} role="status">
      <h1 className={styles.title}>{label} aren&apos;t available yet</h1>
      <p className={styles.text}>This demo covers places to stay. You can still search and book homes.</p>
      <Link href={homesHref} className={styles.action}>
        Browse homes
      </Link>
    </div>
  );
}
