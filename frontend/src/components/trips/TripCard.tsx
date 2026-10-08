import Image from "next/image";
import Link from "next/link";

import { dateRange, formatPrice, pluralize } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import type { Booking } from "@/lib/types/booking";

import styles from "./TripCard.module.css";

export function TripCard({ booking }: { booking: Booking }) {
  const { listing } = booking;
  return (
    <Link href={`/trips/${booking.id}`} className={styles.card}>
      <div className={styles.thumb}>
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt=""
            fill
            sizes="160px"
            unoptimized={!isOptimizableImage(listing.image_url)}
            className={styles.image}
          />
        ) : null}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{listing.title}</p>
        <p className={styles.muted}>
          {listing.city}, {listing.state} · Hosted by {listing.host_name}
        </p>
        <p>
          {dateRange(booking.check_in, booking.check_out)} · {pluralize(booking.guests, "guest")}
        </p>
        <p className={styles.total}>{formatPrice(booking.price.total, booking.price.currency)} total</p>
      </div>
      <span className={`${styles.status} ${booking.status === "cancelled" ? styles.cancelled : ""}`}>
        {booking.status === "cancelled" ? "Cancelled" : "Confirmed"}
      </span>
    </Link>
  );
}
