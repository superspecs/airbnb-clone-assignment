import Link from "next/link";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ListingGrid, ListingGridSkeleton } from "@/components/listing/ListingGrid";
import { getWishlist } from "@/lib/api/account";
import { errorMessage } from "@/lib/api/client";
import { getCurrentUserId } from "@/lib/session";

import styles from "../account.module.css";

export default function WishlistsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={`${styles.main} ${styles.wide}`}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Wishlists</h1>
            <p className={styles.subtitle}>Places the current demo user has saved.</p>
          </div>
        </div>
        <Suspense fallback={<ListingGridSkeleton count={4} />}>
          <SavedListings />
        </Suspense>
      </main>
    </>
  );
}

async function SavedListings() {
  const result = await getWishlist(await getCurrentUserId()).then(
    (wishlist) => ({ ok: true as const, wishlist }),
    (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
  );
  if (!result.ok) return <ResultsError title="We couldn't load your wishlist" message={result.message} />;
  const { items, listing_ids } = result.wishlist;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Tap the heart on any stay to save it here.</p>
        <Link href="/" className={styles.primary}>
          Explore stays
        </Link>
      </div>
    );
  }
  return <ListingGrid listings={items} savedIds={listing_ids} />;
}
