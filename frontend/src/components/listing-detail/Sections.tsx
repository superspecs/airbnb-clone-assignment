import { Avatar } from "@/components/layout/Avatar";
import { longDate, pluralize, PROPERTY_LABELS, yearOf } from "@/lib/format";
import type { ListingDetail } from "@/lib/types/listing";

import { ComingSoonButton } from "./DetailActions";
import styles from "./Sections.module.css";

export function Overview({ listing }: { listing: ListingDetail }) {
  const type = PROPERTY_LABELS[listing.property_type] ?? listing.property_type;
  const room = listing.room_type === "private_room" ? `Private room in ${type.toLowerCase()}` : `Entire ${type.toLowerCase()}`;
  return (
    <section className={styles.section}>
      <h2 className={styles.overviewTitle}>
        {room} in {listing.city}, {listing.state}
      </h2>
      <p className={styles.facts}>
        {pluralize(listing.max_guests, "guest")} · {pluralize(listing.bedrooms, "bedroom")} ·{" "}
        {pluralize(listing.beds, "bed")} · {pluralize(listing.bathrooms, "bathroom")}
      </p>
      <p className={styles.ratingLine}>
        {listing.rating !== null ? (
          <>
            <strong>★ {listing.rating.toFixed(2)}</strong> · {pluralize(listing.review_count, "review")}
          </>
        ) : (
          "New listing"
        )}
      </p>
      <div className={styles.hostRow}>
        <Avatar name={listing.host.name} size={44} />
        <div>
          <p className={styles.strong}>Hosted by {listing.host.name}</p>
          <p className={styles.muted}>
            {listing.host.is_superhost ? "Superhost · " : ""}Hosting since {yearOf(listing.host.joined_at)}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Description({ text }: { text: string }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>About this place</h2>
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}
    </section>
  );
}

export function Amenities({ listing }: { listing: ListingDetail }) {
  return (
    <section className={styles.section} id="amenities">
      <h2 className={styles.heading}>What this place offers</h2>
      {listing.amenities.length === 0 ? (
        <p className={styles.muted}>The host hasn&apos;t listed amenities yet.</p>
      ) : (
        <ul className={styles.amenities}>
          {listing.amenities.map((amenity) => (
            <li key={amenity.code}>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              {amenity.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Reviews({ listing }: { listing: ListingDetail }) {
  const { rating_summary: summary, reviews } = listing;
  return (
    <section className={styles.section} id="reviews">
      <h2 className={styles.heading}>
        {summary.average !== null
          ? `★ ${summary.average.toFixed(2)} · ${pluralize(summary.count, "review")}`
          : "No reviews yet"}
      </h2>
      {summary.count > 0 && (
        <div className={styles.distribution} aria-label="Rating distribution">
          {summary.distribution.map((bucket) => (
            <div key={bucket.stars} className={styles.bar}>
              <span>{bucket.stars}</span>
              <span className={styles.track}>
                <span className={styles.fill} style={{ width: `${(bucket.count / summary.count) * 100}%` }} />
              </span>
              <span className={styles.muted}>{bucket.count}</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.reviewGrid}>
        {reviews.slice(0, 8).map((review) => (
          <article key={review.id} className={styles.review}>
            <div className={styles.reviewer}>
              <Avatar name={review.author.name} size={40} />
              <div>
                <p className={styles.strong}>{review.author.name}</p>
                <p className={styles.muted}>{longDate(review.created_at.slice(0, 10))}</p>
              </div>
            </div>
            <p className={styles.stars} aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              <span className={styles.emptyStars}>{"★".repeat(5 - review.rating)}</span>
            </p>
            <p className={styles.paragraph}>{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LocationMap({ listing }: { listing: ListingDetail }) {
  const { latitude: lat, longitude: lng } = listing;
  const d = 0.04;
  // Basic embedded OpenStreetMap view (no API key). Exact address is shared only after booking.
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <section className={styles.section} id="location">
      <h2 className={styles.heading}>Where you&apos;ll be</h2>
      <p className={styles.paragraph}>
        {listing.address}, {listing.state}, {listing.country}
      </p>
      <iframe className={styles.map} title={`Map of ${listing.city}`} src={src} loading="lazy" />
      <p className={styles.muted}>Approximate location. The exact address is shared after booking.</p>
    </section>
  );
}

export function HostSection({ listing }: { listing: ListingDetail }) {
  const { host } = listing;
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Meet your host</h2>
      <div className={styles.hostCard}>
        <Avatar name={host.name} size={72} />
        <div>
          <p className={styles.hostName}>{host.name}</p>
          <p className={styles.muted}>
            {host.is_superhost ? "Superhost · " : ""}Hosting since {yearOf(host.joined_at)}
          </p>
          {host.bio && <p className={styles.paragraph}>{host.bio}</p>}
          <ComingSoonButton label="Message host" message="Messaging hosts is coming soon." />
        </div>
      </div>
    </section>
  );
}

