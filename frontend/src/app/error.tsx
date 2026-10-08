"use client";

import Link from "next/link";

import styles from "./status.module.css";

/** Route-level error boundary for unexpected failures (API errors are handled inline). */
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className={styles.main}>
      <p className={styles.code}>Something went wrong</p>
      <h1 className={styles.title}>This page didn&apos;t load</h1>
      <p className={styles.text}>
        The server may be waking up (the demo API sleeps when idle). Try again in a moment.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={reset}>
          Try again
        </button>
        <Link href="/" className={styles.secondary}>
          Back to Explore
        </Link>
      </div>
    </main>
  );
}
