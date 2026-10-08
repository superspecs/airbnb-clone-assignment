import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { DeleteListingButton } from "@/components/host/DeleteListingButton";
import { HostOnly } from "@/components/host/HostOnly";
import hostStyles from "@/components/host/Host.module.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getDemoUsers } from "@/lib/api/account";
import { errorMessage } from "@/lib/api/client";
import { getHostBookings, getHostListings } from "@/lib/api/host";
import { dateRange, formatPrice, pluralize, PROPERTY_LABELS } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import { getCurrentUserId } from "@/lib/session";
import { marketplaceToday } from "@/lib/stay";

import styles from "../account.module.css";

export default function HostDashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className={`${styles.main} ${styles.wide}`}>
        <Suspense fallback={<p className={styles.muted}>Loading your hosting dashboard…</p>}>
          <Dashboard />
        </Suspense>
      </main>
    </>
  );
}

async function Dashboard() {
  const userId = await getCurrentUserId();
  const usersResult = await getDemoUsers().then(
    (users) => ({ ok: true as const, users }),
    (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
  );
  if (!usersResult.ok) return <ResultsError title="We couldn't load your hosting dashboard" message={usersResult.message} />;
  const { users } = usersResult;
  const me = users.find((u) => u.id === userId);
  if (!me?.is_host) return <HostOnly hosts={users.filter((u) => u.is_host)} />;

  const result = await Promise.all([getHostListings(userId), getHostBookings(userId)]).then(
    ([listings, bookings]) => ({ ok: true as const, listings, bookings }),
    (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
  );
  if (!result.ok) return <ResultsError title="We couldn't load your hosting dashboard" message={result.message} />;
  const { listings, bookings } = result;
  const today = marketplaceToday();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.check_out > today);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Welcome back, {me.name.split(" ")[0]}</h1>
          <p className={styles.subtitle}>
            {pluralize(listings.length, "listing")} · {pluralize(upcoming.length, "upcoming reservation")}
          </p>
        </div>
        <Link href="/host/listings/new" className={styles.primary}>
          + Create listing
        </Link>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your listings</h2>
        {listings.length === 0 ? (
          <div className={styles.empty}>
            <p>You don&apos;t have any listings yet.</p>
            <Link href="/host/listings/new" className={styles.primary}>
              Create your first listing
            </Link>
          </div>
        ) : (
          <table className={hostStyles.table}>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Type</th>
                <th>Nightly price</th>
                <th>Guests</th>
                <th>Upcoming</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <Link href={`/listings/${listing.id}`} className={hostStyles.listingCell}>
                      <span className={hostStyles.thumb}>
                        {listing.image_url && (
                          <Image
                            src={listing.image_url}
                            alt=""
                            fill
                            sizes="64px"
                            unoptimized={!isOptimizableImage(listing.image_url)}
                            className={hostStyles.thumbImage}
                          />
                        )}
                      </span>
                      <span>
                        <span className={hostStyles.strong}>{listing.title}</span>
                        <span className={hostStyles.muted}>
                          {listing.city}, {listing.state}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>{PROPERTY_LABELS[listing.property_type]}</td>
                  <td>{formatPrice(listing.nightly_price, listing.currency)}</td>
                  <td>{listing.max_guests}</td>
                  <td>{listing.upcoming_bookings}</td>
                  <td className={hostStyles.actions}>
                    <Link href={`/host/listings/${listing.id}/edit`} className={hostStyles.edit}>
                      Edit
                    </Link>
                    <DeleteListingButton listingId={listing.id} title={listing.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reservations</h2>
        {bookings.length === 0 ? (
          <p className={styles.muted}>No reservations on your listings yet.</p>
        ) : (
          <table className={hostStyles.table}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Listing</th>
                <th>Dates</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const status =
                  booking.status === "cancelled" ? "Cancelled" : booking.check_out <= today ? "Completed" : "Upcoming";
                return (
                  <tr key={booking.id}>
                    <td className={hostStyles.strong}>{booking.guest.name}</td>
                    <td>{booking.listing.title}</td>
                    <td>{dateRange(booking.check_in, booking.check_out)}</td>
                    <td>{booking.guests}</td>
                    <td>{formatPrice(booking.price.total, booking.price.currency)}</td>
                    <td>
                      <span className={`${hostStyles.badge} ${hostStyles[status.toLowerCase()]}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
