import type { ListingCard as ListingCardData } from "@/lib/types/listing";

import { ListingCard } from "./ListingCard";
import styles from "./ListingGrid.module.css";

const ABOVE_THE_FOLD = 4;

interface ListingGridProps {
  listings: ListingCardData[];
  savedIds?: number[];
  linkQuery?: string;
  nights?: number;
}

export function ListingGrid({ listings, savedIds = [], linkQuery, nights }: ListingGridProps) {
  const saved = new Set(savedIds);
  return (
    <ul className={styles.grid}>
      {listings.map((listing, i) => (
        <li key={listing.id}>
          <ListingCard
            listing={listing}
            preloadImage={i < ABOVE_THE_FOLD}
            initiallySaved={saved.has(listing.id)}
            linkQuery={linkQuery}
            nights={nights}
          />
        </li>
      ))}
    </ul>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading stays…</span>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.short}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
