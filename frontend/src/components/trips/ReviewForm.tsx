"use client";

import { type FormEvent, useState, useTransition } from "react";

import { leaveReview } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import { REVIEW_COMMENT_MAX, REVIEW_COMMENT_MIN } from "@/lib/types/booking";

import styles from "./Review.module.css";

const RATING_LABELS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

/** Post-stay review: 1–5 stars (native radios, so arrow keys work) and a written comment. */
export function ReviewForm({ bookingId, listingTitle }: { bookingId: number; listingTitle: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = hovered || rating;
  const length = comment.trim().length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) return setError("Choose a star rating.");
    if (length < REVIEW_COMMENT_MIN) return setError(`Write at least ${REVIEW_COMMENT_MIN} characters about your stay.`);
    if (length > REVIEW_COMMENT_MAX) return setError(`Keep your review under ${REVIEW_COMMENT_MAX} characters.`);
    setError(null);
    startTransition(async () => {
      // On success the action refreshes the page, which then shows the published review.
      const result = await leaveReview(bookingId, { rating, comment: comment.trim() });
      if (result.ok) toast("Thanks — your review is published.");
      else {
        setError(result.error);
        toast(result.error, "error");
      }
    });
  }

  return (
    <form className={styles.card} onSubmit={submit} noValidate>
      <h2 className={styles.heading}>How was your stay?</h2>
      <p className={styles.muted}>Your review of {listingTitle} appears on the listing for other guests.</p>

      <fieldset className={styles.fieldset} onMouseLeave={() => setHovered(0)}>
        <legend className={styles.label}>Rating</legend>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className={styles.star} onMouseEnter={() => setHovered(value)}>
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="visually-hidden"
              />
              <span aria-hidden="true" className={value <= shown ? styles.starOn : styles.starOff}>
                ★
              </span>
              <span className="visually-hidden">{`${value} ${value === 1 ? "star" : "stars"}, ${RATING_LABELS[value - 1]}`}</span>
            </label>
          ))}
          <span className={styles.ratingText} aria-hidden="true">
            {shown ? RATING_LABELS[shown - 1] : "Select a rating"}
          </span>
        </div>
      </fieldset>

      <label className={styles.label} htmlFor={`review-${bookingId}`}>
        Your review
      </label>
      <textarea
        id={`review-${bookingId}`}
        className={styles.textarea}
        rows={5}
        maxLength={REVIEW_COMMENT_MAX}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you enjoy? What should future guests know?"
        aria-describedby={`review-${bookingId}-count`}
      />
      <p id={`review-${bookingId}-count`} className={styles.count}>
        {length < REVIEW_COMMENT_MIN
          ? `${REVIEW_COMMENT_MIN - length} more ${REVIEW_COMMENT_MIN - length === 1 ? "character" : "characters"} needed`
          : `${length} / ${REVIEW_COMMENT_MAX}`}
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Publishing…" : "Publish review"}
      </button>
    </form>
  );
}
