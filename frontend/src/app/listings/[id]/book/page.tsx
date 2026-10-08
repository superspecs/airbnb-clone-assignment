import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PriceBreakdown } from "@/components/listing-detail/PriceBreakdown";
import { getDemoUsers } from "@/lib/api/account";
import { getQuote } from "@/lib/api/bookings";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getListing } from "@/lib/api/listings";
import { dateRange, pluralize } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import { getCurrentUserId } from "@/lib/session";
import { isIsoDate } from "@/lib/stay";

import { ConfirmBookingButton } from "./ConfirmBookingButton";
import styles from "./page.module.css";

export default function BookPage({ params, searchParams }: PageProps<"/listings/[id]/book">) {
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <Suspense fallback={<p className={styles.muted}>Preparing your booking…</p>}>
          <Checkout params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Checkout({ params, searchParams }: PageProps<"/listings/[id]/book">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const checkIn = first(sp.check_in);
  const checkOut = first(sp.check_out);
  const guests = Number(first(sp.guests) ?? 1);
  const backHref = `/listings/${id}`;

  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || !Number.isInteger(guests) || guests < 1) {
    return <Problem message="Choose your dates and guests on the listing page first." backHref={backHref} />;
  }
  const stay = { checkIn, checkOut, guests };
  const userId = await getCurrentUserId();

  const result = await Promise.all([getListing(id), getQuote(id, stay, userId), getDemoUsers()]).then(
    ([listing, quote, users]) => ({ ok: true as const, listing, quote, user: users.find((u) => u.id === userId) }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  if (!result.ok) {
    if (result.error instanceof ApiError && result.error.code === "LISTING_NOT_FOUND") notFound();
    return <Problem message={errorMessage(result.error)} backHref={`${backHref}?${new URLSearchParams({ guests: String(guests) })}`} />;
  }
  const { listing, quote, user } = result;
  const editHref = `${backHref}?${new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) })}`;
  const cover = listing.images[0];

  return (
    <div className={styles.layout}>
      <section>
        <div className={styles.titleRow}>
          <Link href={editHref} className={styles.back} aria-label="Back to listing">
            ‹
          </Link>
          <h1 className={styles.title}>Confirm and pay</h1>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Your trip</h2>
          <div className={styles.tripRow}>
            <div>
              <p className={styles.strong}>Dates</p>
              <p>{dateRange(checkIn, checkOut)}</p>
            </div>
            <Link href={editHref} className={styles.edit}>
              Edit
            </Link>
          </div>
          <div className={styles.tripRow}>
            <div>
              <p className={styles.strong}>Guests</p>
              <p>{pluralize(guests, "guest")}</p>
            </div>
            <Link href={editHref} className={styles.edit}>
              Edit
            </Link>
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Payment</h2>
          <div className={styles.demoNotice}>
            <p className={styles.strong}>Demo checkout — no payment is taken.</p>
            <p className={styles.muted}>
              This assignment mocks payments. No card details are requested, collected, or stored.
            </p>
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Booking as</h2>
          <p>
            {user ? `${user.name} (demo ${user.is_host ? "host" : "guest"})` : "Unknown demo user"} — switch users from the
            menu in the top-right corner.
          </p>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Cancellation</h2>
          <p className={styles.muted}>You can cancel any time before check-in from My Trips.</p>
        </div>

        <ConfirmBookingButton listingId={id} stay={stay} />
      </section>

      <aside className={styles.summary}>
        <div className={styles.listing}>
          {cover && (
            <div className={styles.thumb}>
              <Image src={cover.url} alt={cover.alt} fill sizes="120px" unoptimized={!isOptimizableImage(cover.url)} className={styles.cover} />
            </div>
          )}
          <div>
            <p className={styles.strong}>{listing.title}</p>
            <p className={styles.muted}>
              {listing.city}, {listing.state}
            </p>
            {listing.rating !== null && (
              <p className={styles.small}>
                ★ {listing.rating.toFixed(2)} ({listing.review_count})
              </p>
            )}
          </div>
        </div>
        <h2 className={styles.heading}>Price details</h2>
        <PriceBreakdown price={quote.price} />
      </aside>
    </div>
  );
}

function Problem({ message, backHref }: { message: string; backHref: string }) {
  return (
    <div className={styles.problem} role="alert">
      <h1 className={styles.title}>We can&apos;t book this stay</h1>
      <p className={styles.muted}>{message}</p>
      <Link href={backHref} className={styles.button}>
        Back to the listing
      </Link>
    </div>
  );
}
