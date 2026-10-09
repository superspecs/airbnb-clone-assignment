import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ResultsError } from "@/components/explore/StatusMessage";
import { HostOnly } from "@/components/host/HostOnly";
import { ListingForm } from "@/components/host/ListingForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getDemoUsers } from "@/lib/api/account";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getAmenities, getHostListing } from "@/lib/api/host";
import { getCurrentUserId } from "@/lib/session";

import styles from "../../../../account.module.css";

export default function EditListingPage({ params }: PageProps<"/host/listings/[id]/edit">) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Edit listing</h1>
            <p className={styles.subtitle}>Changes apply to future bookings; existing reservations keep their price.</p>
          </div>
        </div>
        <Suspense fallback={<p className={styles.muted}>Loading listing…</p>}>
          <EditListing params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function EditListing({ params }: Pick<PageProps<"/host/listings/[id]/edit">, "params">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [userId, users] = await Promise.all([getCurrentUserId(), getDemoUsers().catch((error: unknown) => error)]);
  if (!Array.isArray(users)) return <ResultsError title="We couldn't load this listing" message={errorMessage(users)} />;
  if (!users.find((u) => u.id === userId)?.is_host) return <HostOnly hosts={users.filter((u) => u.is_host)} />;

  const result = await Promise.all([getHostListing(id, userId), getAmenities()]).then(
    ([listing, amenities]) => ({ ok: true as const, listing, amenities }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  if (!result.ok) {
    if (result.error instanceof ApiError && result.error.status === 404) notFound();
    return <ResultsError title="We couldn't load this listing" message={errorMessage(result.error)} />;
  }
  return <ListingForm amenities={result.amenities} listing={result.listing} />;
}
