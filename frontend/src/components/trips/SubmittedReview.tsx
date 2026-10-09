import Link from "next/link";

import { longDate } from "@/lib/format";
import type { Review } from "@/lib/types/listing";

import styles from "./Review.module.css";

/** A published review on the reservation page (the guest's own, or the guest's for the host). */
export function SubmittedReview({ review, title, listingHref }: { review: Review; title: string; listingHref?: string }) {
  return (
    <section className={styles.card} aria-labelledby={`review-${review.id}-title`}>
      <h2 id={`review-${review.id}-title`} className={styles.heading}>
        {title}
      </h2>
      <p className={styles.published} aria-label={`${review.rating} out of 5 stars`}>
        <span className={styles.starOn}>{"★".repeat(review.rating)}</span>
        <span className={styles.starOff}>{"★".repeat(5 - review.rating)}</span>
        <span className={styles.muted}> · {longDate(review.created_at.slice(0, 10))}</span>
      </p>
      <p className={styles.comment}>{review.comment}</p>
      {listingHref && (
        <Link href={listingHref} className={styles.link}>
          See it on the listing
        </Link>
      )}
    </section>
  );
}
