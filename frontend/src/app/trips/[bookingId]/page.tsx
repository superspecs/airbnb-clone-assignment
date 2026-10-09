import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ComingSoonButton } from "@/components/listing-detail/DetailActions";
import { PriceBreakdown } from "@/components/listing-detail/PriceBreakdown";
import { ReviewForm } from "@/components/trips/ReviewForm";
import { SubmittedReview } from "@/components/trips/SubmittedReview";
import { getBooking } from "@/lib/api/bookings";
import { ApiError, errorMessage } from "@/lib/api/client";
import { dateRange, formatPrice, longDate, pluralize } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import { getCurrentUserId } from "@/lib/session";
import { marketplaceToday } from "@/lib/stay";

import accountStyles from "../../account.module.css";
import { CancelTripButton } from "./CancelTripButton";
import styles from "./page.module.css";

export default function TripPage({ params }: PageProps<"/trips/[bookingId]">) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={accountStyles.main}>
        <Suspense fallback={<p className={accountStyles.muted}>Loading reservation…</p>}>
          <TripDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function TripDetail({ params }: Pick<PageProps<"/trips/[bookingId]">, "params">) {
  const id = Number((await params).bookingId);
  if (!Number.isInteger(id) || id < 1) notFound();
  const userId = await getCurrentUserId();
  const result = await getBooking(id, userId).then(
    (booking) => ({ ok: true as const, booking }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  if (!result.ok) {
    if (result.error instanceof ApiError && result.error.status === 404) notFound();
    return <ResultsError title="We couldn't load this reservation" message={errorMessage(result.error)} />;
  }
  const { booking } = result;
  const { listing } = booking;
  const today = marketplaceToday();
  // The API only returns a booking to its guest or the listing's host.
  const asHost = booking.guest.id !== userId;
  const cancellable = booking.status === "confirmed" && booking.check_in > today;
  const upcoming = booking.status === "confirmed" && booking.check_out > today;
  // Reviews open once the stay has ended (check-out day counts as ended).
  const completed = booking.status === "confirmed" && booking.check_out <= today;
  const { price } = booking;
  // The guest pays the service fee; the host is paid the stay subtotal plus the cleaning fee.
  const payout = price.subtotal + price.cleaning_fee;

  return (
    <div className={styles.layout}>
      <section>
        <p className={styles.eyebrow}>Reservation #{booking.id}</p>
        <h1 className={accountStyles.title}>
          {booking.status === "cancelled"
            ? "This reservation was cancelled"
            : asHost
              ? `${booking.guest.name.split(" ")[0]}'s reservation`
              : upcoming
                ? "Your reservation is confirmed"
                : "Completed stay"}
        </h1>
        <p className={accountStyles.subtitle}>
          {listing.title} · {listing.city}, {listing.state}
        </p>

        <dl className={styles.facts}>
          <div>
            <dt>Check-in</dt>
            <dd>{longDate(booking.check_in)}</dd>
          </div>
          <div>
            <dt>Checkout</dt>
            <dd>{longDate(booking.check_out)}</dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{pluralize(booking.guests, "guest")}</dd>
          </div>
          <div>
            <dt>Nights</dt>
            <dd>{price.nights}</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{longDate(booking.created_at.slice(0, 10))}</dd>
          </div>
          <div>
            <dt>Booked by</dt>
            <dd>{booking.guest.name}</dd>
          </div>
          <div>
            <dt>Host</dt>
            <dd>{listing.host_name}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>Demo confirmation — no charge</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          {listing.is_active ? (
            <Link href={`/listings/${listing.id}`} className={accountStyles.secondary}>
              View listing
            </Link>
          ) : (
            <span className={accountStyles.muted}>The host has removed this listing.</span>
          )}
          {asHost ? (
            <>
              <Link href="/host" className={accountStyles.secondary}>
                Back to dashboard
              </Link>
              <ComingSoonButton label="Message guest" message="Messaging guests is coming soon." />
            </>
          ) : (
            <Link href="/trips" className={accountStyles.secondary}>
              All trips
            </Link>
          )}
          {cancellable && (
            <CancelTripButton
              bookingId={booking.id}
              refund={formatPrice(price.total, price.currency)}
              dates={`${listing.title} · ${dateRange(booking.check_in, booking.check_out)}`}
              asHost={asHost}
            />
          )}
        </div>

        {booking.review ? (
          <SubmittedReview
            review={booking.review}
            title={asHost ? `${booking.guest.name.split(" ")[0]}'s review` : "Your review"}
            listingHref={listing.is_active ? `/listings/${listing.id}#reviews` : undefined}
          />
        ) : (
          completed &&
          !asHost &&
          (listing.is_active ? (
            <ReviewForm bookingId={booking.id} listingTitle={listing.title} />
          ) : (
            <p className={accountStyles.muted}>This listing was removed, so the stay can&apos;t be reviewed.</p>
          ))
        )}
      </section>

      <aside className={styles.summary}>
        {listing.image_url && (
          <div className={styles.cover}>
            <Image
              src={listing.image_url}
              alt=""
              fill
              sizes="440px"
              unoptimized={!isOptimizableImage(listing.image_url)}
              className={styles.image}
            />
          </div>
        )}
        <h2 className={styles.summaryTitle}>{asHost ? "Guest paid" : "Price details"}</h2>
        <PriceBreakdown price={price} />
        {asHost && (
          <div className={styles.payout}>
            <h2 className={styles.summaryTitle}>Your payout</h2>
            <p className={styles.payoutRow}>
              <span>
                {formatPrice(price.nightly_price, price.currency)} × {pluralize(price.nights, "night")}
              </span>
              <span>{formatPrice(price.subtotal, price.currency)}</span>
            </p>
            <p className={styles.payoutRow}>
              <span>Cleaning fee</span>
              <span>{formatPrice(price.cleaning_fee, price.currency)}</span>
            </p>
            <p className={`${styles.payoutRow} ${styles.payoutTotal}`}>
              <span>Total payout{booking.status === "cancelled" ? " (cancelled)" : ""}</span>
              <span>{formatPrice(booking.status === "cancelled" ? 0 : payout, price.currency)}</span>
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
