import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PriceBreakdown } from "@/components/listing-detail/PriceBreakdown";
import { getBooking } from "@/lib/api/bookings";
import { ApiError, errorMessage } from "@/lib/api/client";
import { longDate, pluralize } from "@/lib/format";
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
      <main className={accountStyles.main}>
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
    return <ResultsError message={errorMessage(result.error)} />;
  }
  const { booking } = result;
  const { listing } = booking;
  const today = marketplaceToday();
  const cancellable = booking.status === "confirmed" && booking.check_in > today && booking.guest.id === userId;
  const upcoming = booking.status === "confirmed" && booking.check_out > today;

  return (
    <div className={styles.layout}>
      <section>
        <p className={styles.eyebrow}>Reservation #{booking.id}</p>
        <h1 className={accountStyles.title}>
          {booking.status === "cancelled"
            ? "This reservation was cancelled"
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
          <Link href="/trips" className={accountStyles.secondary}>
            All trips
          </Link>
          {cancellable && <CancelTripButton bookingId={booking.id} />}
        </div>
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
        <h2 className={styles.summaryTitle}>Price details</h2>
        <PriceBreakdown price={booking.price} />
      </aside>
    </div>
  );
}
