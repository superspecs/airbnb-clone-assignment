import { ListingCarousel, ListingGrid, ListingsWithMap } from "@/components/listing/ListingGrid";
import { getWishlist } from "@/lib/api/account";
import { errorMessage } from "@/lib/api/client";
import { getAllListings, searchListings } from "@/lib/api/listings";
import { type ExploreQuery, activeFilterCount, exploreHref, isSearchMode } from "@/lib/explore-query";
import { formatPrice, pluralize, shortDate } from "@/lib/format";
import { getCurrentUserId } from "@/lib/session";
import { nightsBetween } from "@/lib/stay";
import type { ListingCard } from "@/lib/types/listing";

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

interface HomeSection {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  listings: ListingCard[];
}

const fromPrice = (items: ListingCard[]) =>
  formatPrice(Math.min(...items.map((i) => i.nightly_price)), items[0].currency);

// Plain geography for grouping homepage rows (not listing data); unlisted states fall through.
const REGIONS: { name: string; states: string[] }[] = [
  { name: "South India", states: ["Karnataka", "Kerala", "Tamil Nadu", "Puducherry", "Andhra Pradesh", "Telangana"] },
  { name: "North India", states: ["Himachal Pradesh", "Uttarakhand", "Delhi", "Punjab", "Jammu and Kashmir", "Uttar Pradesh"] },
  { name: "West India", states: ["Maharashtra", "Rajasthan", "Gujarat"] },
];

const listStates = (states: string[]) =>
  states.length < 2 ? states.join("") : `${states.slice(0, -1).join(", ")} and ${states[states.length - 1]}`;

const byRating = (a: ListingCard, b: ListingCard) => (b.rating ?? 0) - (a.rating ?? 0) || b.review_count - a.review_count;

/**
 * Homepage rows composed from real listing data (the API has no recommendation feed): the
 * destination with the most homes, guest favourites from actual ratings, regional rows, and a
 * final row with every stay so each listing is reachable from the homepage.
 */
function homeSections(items: ListingCard[]): HomeSection[] {
  const byState = new Map<string, ListingCard[]>();
  for (const item of items) byState.set(item.state, [...(byState.get(item.state) ?? []), item]);
  const [topState, topList] = [...byState.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];

  const sections: HomeSection[] = [
    {
      id: "section-popular",
      title: `Popular homes in ${topState}`,
      subtitle: `${pluralize(topList.length, "home")} · from ${fromPrice(topList)} a night`,
      href: exploreHref({ propertyTypes: [], amenities: [], page: 1 }, { location: topState }),
      listings: [...topList].sort(byRating),
    },
  ];

  const favourites = items.filter((i) => i.rating !== null && i.rating >= 4.8 && i.review_count >= 3).sort(byRating);
  if (favourites.length >= 3) {
    sections.push({
      id: "section-guest-favourites",
      title: "Guest favourites",
      subtitle: "Rated 4.8 or higher by at least three guests",
      listings: favourites,
    });
  }

  for (const region of REGIONS) {
    const list = items.filter((i) => i.state !== topState && region.states.includes(i.state)).sort(byRating);
    if (list.length < 3) continue;
    sections.push({
      id: `section-${region.name.toLowerCase().replace(/\W+/g, "-")}`,
      title: `Homes in ${region.name}`,
      subtitle: listStates([...new Set(list.map((i) => i.state))]),
      listings: list,
    });
  }

  sections.push({
    id: "section-all",
    title: "All stays",
    subtitle: `${pluralize(items.length, "home")} across ${new Set(items.map((i) => i.state)).size} states`,
    listings: items,
  });
  return sections;
}

/** Plain homepage (no search, category, filters or page): recommendation carousels. */
async function HomeOverview({ savedIds }: { savedIds: number[] }) {
  const result = await getAllListings().then(
    (data) => ({ ok: true as const, data }),
    (error: unknown) => ({ ok: false as const, message: errorMessage(error) }),
  );
  if (!result.ok) return <ResultsError message={result.message} />;
  if (result.data.items.length === 0) return <EmptyResults clearHref="/" />;
  return (
    <div className={styles.home}>
      <h1 className="visually-hidden">Places to stay</h1>
      {homeSections(result.data.items).map((section, i) => (
        <ListingCarousel key={section.id} {...section} savedIds={savedIds} eager={i === 0} />
      ))}
    </div>
  );
}

export async function ExploreResults({ query }: { query: ExploreQuery }) {
  const isOverview = !isSearchMode(query) && !query.category && activeFilterCount(query) === 0 && query.page === 1;
  if (isOverview) {
    const userId = await getCurrentUserId();
    const savedIds = await getWishlist(userId).then((w) => w.listing_ids, () => [] as number[]);
    return <HomeOverview savedIds={savedIds} />;
  }

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

  if (isSearchMode(query)) {
    const place = query.location ? ` in ${query.location.replace(/\b\p{L}/gu, (c) => c.toUpperCase())}` : "";
    return (
      <ListingsWithMap
        listings={items}
        savedIds={savedIds}
        linkQuery={stayQuery(query)}
        nights={nights}
        title={`${pluralize(total, "home")}${place}`}
        note={nights ? "Prices before cleaning and service fees" : "Prices per night, before fees"}
        footer={<Pagination query={query} totalPages={total_pages} />}
      />
    );
  }

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
