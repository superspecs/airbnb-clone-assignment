import Link from "next/link";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ListingGridSkeleton } from "@/components/listing/ListingGrid";
import { TripCard } from "@/components/trips/TripCard";
import { getTrips } from "@/lib/api/bookings";
import { errorMessage } from "@/lib/api/client";
import { getCurrentUserId } from "@/lib/session";
import { marketplaceToday } from "@/lib/stay";
import type { Booking } from "@/lib/types/booking";

import styles from "../account.module.css";

export default function TripsPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Trips</h1>
            <p className={styles.subtitle}>Reservations made by the current demo user.</p>
          </div>
        </div>
        <Suspense fallback={<ListingGridSkeleton count={4} />}>
          <TripsList />
        </Suspense>
      </main>
    </>
  );
}

async function TripsList() {
  const result = await getTrips(await getCurrentUserId()).then(
    (trips) => ({ ok: true as const, trips }),
    (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
  );
  if (!result.ok) return <ResultsError message={result.message} />;

  const today = marketplaceToday();
  const confirmed = result.trips.filter((t) => t.status === "confirmed");
  const upcoming = confirmed.filter((t) => t.check_out > today).sort((a, b) => a.check_in.localeCompare(b.check_in));
  const past = confirmed.filter((t) => t.check_out <= today);
  const cancelled = result.trips.filter((t) => t.status === "cancelled");

  if (result.trips.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No trips booked… yet! Time to dust off your bags.</p>
        <Link href="/" className={styles.primary}>
          Start searching
        </Link>
      </div>
    );
  }

  return (
    <>
      <TripSection title="Upcoming" trips={upcoming} emptyText="No upcoming trips." />
      <TripSection title="Past" trips={past} emptyText="No past trips yet." />
      {cancelled.length > 0 && <TripSection title="Cancelled" trips={cancelled} emptyText="" />}
    </>
  );
}

function TripSection({ title, trips, emptyText }: { title: string; trips: Booking[]; emptyText: string }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {trips.length === 0 ? (
        <p className={styles.muted}>{emptyText}</p>
      ) : (
        <div className={styles.twoCol}>
          {trips.map((trip) => (
            <TripCard key={trip.id} booking={trip} />
          ))}
        </div>
      )}
    </section>
  );
}
