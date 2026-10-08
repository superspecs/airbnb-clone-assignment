"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatPrice, pluralize } from "@/lib/format";
import { nightsBetween } from "@/lib/stay";

import styles from "./StickyBookingBar.module.css";
import { useStay } from "./StayContext";

const SECTIONS = [
  { id: "photos", label: "Photos" },
  { id: "amenities", label: "Amenities" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
];

interface StickyBookingBarProps {
  nightlyPrice: number;
  currency: string;
  rating: number | null;
  reviewCount: number;
}

/**
 * Airbnb-style bar that replaces the header once the gallery scrolls away: section links, and —
 * when the booking widget is also out of view — the price and a Reserve button.
 */
export function StickyBookingBar({ nightlyPrice, currency, rating, reviewCount }: StickyBookingBarProps) {
  const { listingId, checkIn, checkOut, guests } = useStay();
  const [pastGallery, setPastGallery] = useState(false);
  const [widgetHidden, setWidgetHidden] = useState(false);

  useEffect(() => {
    const gallery = document.getElementById("photos");
    const widget = document.getElementById("booking-widget");
    const observers: IntersectionObserver[] = [];
    if (gallery) {
      const o = new IntersectionObserver(([entry]) => setPastGallery(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      o.observe(gallery);
      observers.push(o);
    }
    if (widget) {
      const o = new IntersectionObserver(([entry]) => setWidgetHidden(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
        rootMargin: "-80px 0px 0px 0px",
      });
      o.observe(widget);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (!pastGallery) return null;

  const hasStay = checkIn && checkOut;
  const reserveHref = hasStay
    ? `/listings/${listingId}/book?${new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) })}`
    : null;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="Listing sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className={styles.link}>
              {section.label}
            </a>
          ))}
        </nav>
        {widgetHidden && (
          <div className={styles.cta}>
            <div className={styles.price}>
              <p>
                <strong>{formatPrice(nightlyPrice, currency)}</strong> night
                {hasStay && <span className={styles.muted}> · {pluralize(nightsBetween(checkIn, checkOut), "night")} selected</span>}
              </p>
              {rating !== null && (
                <p className={styles.muted}>
                  ★ {rating.toFixed(2)} · {pluralize(reviewCount, "review")}
                </p>
              )}
            </div>
            {reserveHref ? (
              <Link href={reserveHref} className={styles.reserve}>
                Reserve
              </Link>
            ) : (
              <a href="#availability" className={styles.reserve}>
                Check availability
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
