import { ListingGrid } from "@/components/listing/ListingGrid";
import { getWishlist } from "@/lib/api/account";
import { errorMessage } from "@/lib/api/client";
import { searchListings } from "@/lib/api/listings";
import type { ExploreQuery } from "@/lib/explore-query";
import { pluralize, shortDate } from "@/lib/format";
import { getCurrentUserId } from "@/lib/session";
import { nightsBetween } from "@/lib/stay";

import styles from "./ExploreResults.module.css";
import { Pagination } from "./Pagination";
import { EmptyResults, ResultsError } from "./StatusMessage";

function summary(query: ExploreQuery, total: number): string {
  const parts = [pluralize(total, "stay")];
  // Show the typed place in title case ("goa" → "Goa").
  if (query.location) parts[0] += ` in ${query.location.replace(/\b\p{L}/gu, (c) => c.toUpperCase())}`;
  if (query.checkIn && query.checkOut) parts.push(`${shortDate(query.checkIn)} – ${shortDate(query.checkOut)}`);
  if (query.guests) parts.push(pluralize(query.guests, "guest"));
  return parts.join(" · ");
}

/** Dates/guests carried from Explore to the listing page so the booking widget is prefilled. */
function stayQuery(query: ExploreQuery): string {
  const params = new URLSearchParams();
  if (query.checkIn && query.checkOut) {
    params.set("check_in", query.checkIn);
    params.set("check_out", query.checkOut);
  }
  if (query.guests) params.set("guests", String(query.guests));
  return params.toString();
}

export async function ExploreResults({ query }: { query: ExploreQuery }) {
  const userId = await getCurrentUserId();
  const [result, savedIds] = await Promise.all([
    searchListings(query).then(
      (data) => ({ ok: true as const, data }),
      (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
    ),
    // Saved state is a nicety; Explore still works if the wishlist call fails.
    getWishlist(userId).then((w) => w.listing_ids, () => []),
  ]);

  if (!result.ok) return <ResultsError message={result.message} />;

  const { items, total, total_pages } = result.data;
  const nights = query.checkIn && query.checkOut ? nightsBetween(query.checkIn, query.checkOut) : undefined;
  // Also covers a page number beyond the last page (e.g. an edited URL).
  if (items.length === 0) return <EmptyResults clearHref="/" />;

  return (
    <section aria-labelledby="results-heading">
      <div className={styles.heading}>
        <h1 id="results-heading" className={styles.title}>
          {summary(query, total)}
        </h1>
        <p className={styles.note}>
          {nights ? `Prices for ${pluralize(nights, "night")}, before cleaning and service fees` : "Prices are per night, before fees"}
        </p>
      </div>
      <ListingGrid listings={items} savedIds={savedIds} linkQuery={stayQuery(query)} nights={nights} />
      <Pagination query={query} totalPages={total_pages} />
    </section>
  );
}
