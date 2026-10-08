import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { BookingWidget } from "@/components/listing-detail/BookingWidget";
import { CalendarSection } from "@/components/listing-detail/CalendarSection";
import { DetailActions } from "@/components/listing-detail/DetailActions";
import { Gallery } from "@/components/listing-detail/Gallery";
import { Amenities, Description, HostSection, LocationMap, Overview, Reviews } from "@/components/listing-detail/Sections";
import { StayProvider } from "@/components/listing-detail/StayContext";
import { StickyBookingBar } from "@/components/listing-detail/StickyBookingBar";
import { ResultsError } from "@/components/explore/StatusMessage";
import { getWishlist } from "@/lib/api/account";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getAvailability, getListing } from "@/lib/api/listings";
import { getCurrentUserId } from "@/lib/session";
import { isIsoDate, marketplaceToday } from "@/lib/stay";

import styles from "./page.module.css";

export default function ListingPage({ params, searchParams }: PageProps<"/listings/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <Suspense fallback={<DetailSkeleton />}>
          <ListingContent params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function ListingContent({ params, searchParams }: PageProps<"/listings/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const userId = await getCurrentUserId();
  const result = await Promise.all([getListing(id), getAvailability(id)]).then(
    ([listing, availability]) => ({ ok: true as const, listing, availability }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  if (!result.ok) {
    if (result.error instanceof ApiError && result.error.status === 404) notFound();
    return <ResultsError title="We couldn't load this stay" message={errorMessage(result.error)} />;
  }
  const { listing, availability } = result;
  const savedIds = await getWishlist(userId).then((w) => w.listing_ids, () => [] as number[]);
  const checkIn = first(sp.check_in);
  const checkOut = first(sp.check_out);
  const guests = Number(first(sp.guests));

  return (
    <StayProvider
      listingId={listing.id}
      maxGuests={listing.max_guests}
      today={marketplaceToday()}
      blockedRanges={availability.blocked}
      initial={{
        checkIn: isIsoDate(checkIn) ? checkIn : undefined,
        checkOut: isIsoDate(checkOut) ? checkOut : undefined,
        guests: Number.isInteger(guests) && guests > 0 ? guests : undefined,
      }}
    >
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{listing.title}</h1>
        <DetailActions listingId={listing.id} initiallySaved={savedIds.includes(listing.id)} />
      </div>
      <StickyBookingBar
        nightlyPrice={listing.nightly_price}
        currency={listing.currency}
        rating={listing.rating}
        reviewCount={listing.review_count}
      />
      <div id="photos" className={styles.anchor}>
        <Gallery images={listing.images} />
      </div>

      <div className={styles.body}>
        <div className={styles.content}>
          <Overview listing={listing} />
          <Description text={listing.description} />
          <Amenities listing={listing} />
          <CalendarSection city={listing.city} />
        </div>
        <div className={styles.aside}>
          <BookingWidget
            nightlyPrice={listing.nightly_price}
            currency={listing.currency}
            rating={listing.rating}
            reviewCount={listing.review_count}
          />
        </div>
      </div>

      <Reviews listing={listing} />
      <LocationMap listing={listing} />
      <HostSection listing={listing} />
    </StayProvider>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <span className="visually-hidden">Loading listing…</span>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonGallery}`} />
    </div>
  );
}
