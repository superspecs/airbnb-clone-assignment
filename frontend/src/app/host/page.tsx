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
import { dateRange, formatPrice, longDate, pluralize, PROPERTY_LABELS } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import { getCurrentUserId } from "@/lib/session";
import { marketplaceToday } from "@/lib/stay";
import type { Booking } from "@/lib/types/booking";

import styles from "../account.module.css";

type ReservationTab = "upcoming" | "current" | "completed" | "cancelled";

const TABS: { value: ReservationTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "current", label: "Currently hosting" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function tabOf(booking: Booking, today: string): ReservationTab {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.check_out <= today) return "completed";
  if (booking.check_in <= today) return "current";
  return "upcoming";
}

export default function HostDashboardPage({ searchParams }: PageProps<"/host">) {
  return (
    <>
      <SiteHeader />
      <main className={`${styles.main} ${styles.wide}`}>
        <Suspense fallback={<p className={styles.muted}>Loading your hosting dashboard…</p>}>
          <Dashboard searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/host">, "searchParams">) {
  const requested = (await searchParams).reservations;
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
  const activeTab = TABS.find((t) => t.value === requested)?.value ?? "upcoming";
  const counts = Object.fromEntries(TABS.map((t) => [t.value, 0])) as Record<ReservationTab, number>;
  for (const b of bookings) counts[tabOf(b, today)] += 1;
  // Upcoming and current: soonest first. Completed and cancelled: most recent first.
  const shown = bookings
    .filter((b) => tabOf(b, today) === activeTab)
    .sort((a, b) =>
      activeTab === "upcoming" || activeTab === "current"
        ? a.check_in.localeCompare(b.check_in)
        : b.check_in.localeCompare(a.check_in),
    );

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
        <nav className={hostStyles.tabs} aria-label="Reservation status">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={t.value === "upcoming" ? "/host" : `/host?reservations=${t.value}`}
              className={`${hostStyles.tab} ${t.value === activeTab ? hostStyles.tabActive : ""}`}
              aria-current={t.value === activeTab ? "page" : undefined}
              scroll={false}
            >
              {t.label} ({counts[t.value]})
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <p className={styles.muted}>
            {bookings.length === 0 ? "No reservations on your listings yet." : "No reservations in this list."}
          </p>
        ) : (
          <table className={hostStyles.table}>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Guest</th>
                <th>Dates</th>
                <th>Guests</th>
                <th>Your payout</th>
                <th>Booked on</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((booking) => {
                const tab = tabOf(booking, today);
                const status = TABS.find((t) => t.value === tab)!.label;
                const payout = booking.status === "cancelled" ? 0 : booking.price.subtotal + booking.price.cleaning_fee;
                return (
                  <tr key={booking.id}>
                    <td>
                      <Link href={`/listings/${booking.listing.id}`} className={hostStyles.listingCell}>
                        <span className={hostStyles.thumb}>
                          {booking.listing.image_url && (
                            <Image
                              src={booking.listing.image_url}
                              alt=""
                              fill
                              sizes="64px"
                              unoptimized={!isOptimizableImage(booking.listing.image_url)}
                              className={hostStyles.thumbImage}
                            />
                          )}
                        </span>
                        <span>
                          <span className={hostStyles.strong}>{booking.listing.title}</span>
                          <span className={hostStyles.muted}>Reservation #{booking.id}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={hostStyles.strong}>{booking.guest.name}</td>
                    <td>
                      {dateRange(booking.check_in, booking.check_out)}
                      <span className={hostStyles.muted}> · {pluralize(booking.price.nights, "night")}</span>
                    </td>
                    <td>{booking.guests}</td>
                    <td>{formatPrice(payout, booking.price.currency)}</td>
                    <td>{longDate(booking.created_at.slice(0, 10))}</td>
                    <td>
                      <span className={`${hostStyles.badge} ${hostStyles[tab]}`}>{status}</span>
                    </td>
                    <td className={hostStyles.actions}>
                      <Link href={`/trips/${booking.id}`} className={hostStyles.edit}>
                        View
                      </Link>
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
