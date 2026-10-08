import { Suspense } from "react";

import { ExploreResults } from "@/components/explore/ExploreResults";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ListingGridSkeleton } from "@/components/listing/ListingGrid";
import { CategoryBar, CategoryTabs } from "@/components/search/CategoryBar";
import { FiltersButton } from "@/components/search/FiltersModal";
import { SearchBar } from "@/components/search/SearchBar";
import { isSearchMode, parseExploreQuery, toUrlParams } from "@/lib/explore-query";

import styles from "./page.module.css";

/** Explore page. All search and filter state lives in the URL query string. */
export default function ExplorePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<ExploreShell />}>
      <Explore searchParams={searchParams} />
    </Suspense>
  );
}

async function Explore({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const query = parseExploreQuery(await searchParams);
  const key = toUrlParams(query).toString();
  const searching = isSearchMode(query);

  return (
    <>
      {/* Search bars are keyed so their inputs reset to the URL after back/forward navigation. */}
      {searching ? (
        // Search results: compact pill from the start, category row below, list + map.
        <SiteHeader bottom={<CategoryBar query={query} />}>
          <SearchBar key={key} query={query} collapse="always" />
        </SiteHeader>
      ) : (
        // Home and category browsing: category tabs on top, large search bar below that folds
        // into the compact pill on scroll.
        <SiteHeader variant="home" tabs={<CategoryTabs query={query} />} aside={<FiltersButton query={query} />}>
          <SearchBar key={key} query={query} collapse="scroll" placement="below" />
        </SiteHeader>
      )}
      <main className={`${styles.main} ${searching ? "" : styles.homeMain}`}>
        <Suspense key={key} fallback={<ListingGridSkeleton />}>
          <ExploreResults query={query} />
        </Suspense>
      </main>
    </>
  );
}

function ExploreShell() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className={styles.main}>
        <ListingGridSkeleton />
      </main>
    </>
  );
}
