import Link from "next/link";

import { type ExploreQuery, exploreHref } from "@/lib/explore-query";

import styles from "./Pagination.module.css";

/** Page numbers to show: first, last, and neighbours of the current page, with gaps as null. */
function pageWindow(current: number, total: number): (number | null)[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
}

export function Pagination({ query, totalPages }: { query: ExploreQuery; totalPages: number }) {
  if (totalPages <= 1) return null;
  const current = Math.min(query.page, totalPages);

  return (
    <nav className={styles.nav} aria-label="Search results pages">
      {current > 1 ? (
        <Link href={exploreHref(query, { page: current - 1 })} className={styles.arrow} aria-label="Previous page">
          ‹
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ‹
        </span>
      )}

      {pageWindow(current, totalPages).map((page, i) =>
        page === null ? (
          <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">
            …
          </span>
        ) : page === current ? (
          <span key={page} className={`${styles.page} ${styles.current}`} aria-current="page">
            {page}
          </span>
        ) : (
          <Link key={page} href={exploreHref(query, { page })} className={styles.page} aria-label={`Page ${page}`}>
            {page}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link href={exploreHref(query, { page: current + 1 })} className={styles.arrow} aria-label="Next page">
          ›
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}
