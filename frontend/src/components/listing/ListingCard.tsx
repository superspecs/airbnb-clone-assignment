"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { toggleSaved } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import { formatPrice, pluralize, PROPERTY_LABELS } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import type { ListingCard as ListingCardData } from "@/lib/types/listing";

import styles from "./ListingCard.module.css";

const IMAGE_SIZES = "(max-width: 549px) 100vw, (max-width: 949px) 50vw, (max-width: 1279px) 33vw, 25vw";

interface ListingCardProps {
  listing: ListingCardData;
  preloadImage?: boolean;
  /** Whether the current demo user has saved this listing. */
  initiallySaved?: boolean;
  /** Query string (dates/guests) carried to the listing page. */
  linkQuery?: string;
  /** Nights in the searched stay; when set, the card shows the stay subtotal like Airbnb. */
  nights?: number;
}

export function ListingCard({ listing, preloadImage = false, initiallySaved = false, linkQuery = "", nights }: ListingCardProps) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  function onToggleSaved() {
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleSaved(listing.id, next);
      if (result.ok) {
        toast(next ? "Saved to your wishlist." : "Removed from your wishlist.");
      } else {
        setSaved(!next);
        toast(result.error, "error");
      }
    });
  }
  const images = listing.images;
  const image = images[index];
  // Airbnb-style card heading: "Villa in Assagao", or "Room in Anjuna" for private rooms.
  const kind = listing.room_type === "private_room" ? "Room" : (PROPERTY_LABELS[listing.property_type] ?? "Stay");
  const heading = `${kind} in ${listing.city}`;

  return (
    <article className={styles.card}>
      <Link href={`/listings/${listing.id}${linkQuery ? `?${linkQuery}` : ""}`} className={styles.link}>
        <div className={styles.media}>
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes={IMAGE_SIZES}
              preload={preloadImage && index === 0}
              unoptimized={!isOptimizableImage(image.url)}
              className={styles.image}
            />
          ) : (
            <div className={styles.noImage}>No photo</div>
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.topLine}>
            <h3 className={styles.location}>{heading}</h3>
            <span className={styles.rating}>
              {listing.rating !== null ? (
                <>
                  <span aria-hidden="true">★</span> {listing.rating.toFixed(2)}
                  <span aria-hidden="true"> ({listing.review_count})</span>
                  <span className="visually-hidden">
                    {" "}
                    out of 5, {pluralize(listing.review_count, "review")}
                  </span>
                </>
              ) : (
                "New"
              )}
            </span>
          </div>
          <p className={styles.title}>{listing.title}</p>
          <p className={styles.meta}>
            {pluralize(listing.bedrooms, "bedroom")} · {pluralize(listing.beds, "bed")}
          </p>
          <p className={styles.price}>
            {nights ? (
              // Display-only subtotal; the server quote on the listing page adds fees.
              <>
                <strong className={styles.stayTotal}>
                  {formatPrice(listing.nightly_price * nights, listing.currency)}
                </strong>{" "}
                for {pluralize(nights, "night")}
              </>
            ) : (
              <>
                <strong>{formatPrice(listing.nightly_price, listing.currency)}</strong> night
              </>
            )}
          </p>
        </div>
      </Link>

      {listing.is_superhost && <span className={styles.badge}>Superhost</span>}

      <button
        type="button"
        className={`${styles.heart} ${saved ? styles.saved : ""}`}
        aria-pressed={saved}
        disabled={pending}
        aria-label={saved ? `Remove ${listing.title} from wishlist` : `Save ${listing.title} to wishlist`}
        onClick={onToggleSaved}
      >
        <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
          <path d="M16 28c7-4.7 14-10 14-17a7 7 0 0 0-14-2.6A7 7 0 0 0 2 11c0 7 7 12.3 14 17z" />
        </svg>
      </button>

      {images.length > 1 && (
        <div className={styles.carousel}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label={`Previous photo of ${listing.title}`}
            hidden={index === 0}
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label={`Next photo of ${listing.title}`}
            hidden={index === images.length - 1}
          >
            ›
          </button>
          <div className={styles.dots} aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.url} className={`${styles.dot} ${i === index ? styles.dotActive : ""}`} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
