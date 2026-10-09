import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";

import styles from "./status.module.css";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>We can&apos;t find that page</h1>
        <p className={styles.text}>
          The stay may have been removed by its host, or the link is out of date.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            Explore stays
          </Link>
          <Link href="/trips" className={styles.secondary}>
            Go to Trips
          </Link>
        </div>
      </main>
    </>
  );
}
