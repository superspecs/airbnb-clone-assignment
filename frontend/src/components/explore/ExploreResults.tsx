import { ListingGrid } from "@/components/listing/ListingGrid";
import { ApiError } from "@/lib/api/client";
import { searchListings } from "@/lib/api/listings";
import type { ExploreQuery } from "@/lib/explore-query";
import { pluralize, shortDate } from "@/lib/format";

import styles from "./ExploreResults.module.css";
import { Pagination } from "./Pagination";
import { EmptyResults, ResultsError } from "./StatusMessage";

function summary(query: ExploreQuery, total: number): string {
  const parts = [pluralize(total, "stay")];
  if (query.location) parts[0] += ` in ${query.location}`;
  if (query.checkIn && query.checkOut) parts.push(`${shortDate(query.checkIn)} – ${shortDate(query.checkOut)}`);
  if (query.guests) parts.push(pluralize(query.guests, "guest"));
  return parts.join(" · ");
}

export async function ExploreResults({ query }: { query: ExploreQuery }) {
  const result = await searchListings(query).then(
    (data) => ({ ok: true as const, data }),
    (error: unknown) => ({
      ok: false as const,
      message: error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
    }),
  );

  if (!result.ok) return <ResultsError message={result.message} />;

  const { items, total, total_pages } = result.data;
  // Also covers a page number beyond the last page (e.g. an edited URL).
  if (items.length === 0) return <EmptyResults clearHref="/" />;

  return (
    <section aria-labelledby="results-heading">
      <div className={styles.heading}>
        <h1 id="results-heading" className={styles.title}>
          {summary(query, total)}
        </h1>
        <p className={styles.note}>Prices are per night, before fees</p>
      </div>
      <ListingGrid listings={items} />
      <Pagination query={query} totalPages={total_pages} />
    </section>
  );
}
