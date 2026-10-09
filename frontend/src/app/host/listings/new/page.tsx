import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { HostOnly } from "@/components/host/HostOnly";
import { ListingForm } from "@/components/host/ListingForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getDemoUsers } from "@/lib/api/account";
import { errorMessage } from "@/lib/api/client";
import { getAmenities } from "@/lib/api/host";
import { getCurrentUserId } from "@/lib/session";

import styles from "../../../account.module.css";

export default function NewListingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Create a listing</h1>
            <p className={styles.subtitle}>It goes live in search as soon as you publish.</p>
          </div>
        </div>
        <Suspense fallback={<p className={styles.muted}>Loading form…</p>}>
          <NewListing />
        </Suspense>
      </main>
    </>
  );
}

async function NewListing() {
  const [userId, users, amenities] = await Promise.all([
    getCurrentUserId(),
    getDemoUsers().catch((error: unknown) => error),
    getAmenities().catch((error: unknown) => error),
  ]);
  if (!Array.isArray(users)) return <ResultsError title="We couldn't load the listing form" message={errorMessage(users)} />;
  if (!users.find((u) => u.id === userId)?.is_host) return <HostOnly hosts={users.filter((u) => u.is_host)} />;
  if (!Array.isArray(amenities)) return <ResultsError title="We couldn't load the listing form" message={errorMessage(amenities)} />;
  return <ListingForm amenities={amenities} />;
}
