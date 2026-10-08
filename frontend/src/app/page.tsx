import { Suspense } from "react";

import { ExploreResults } from "@/components/explore/ExploreResults";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ListingGridSkeleton } from "@/components/listing/ListingGrid";
import { CategoryBar } from "@/components/search/CategoryBar";
import { SearchBar } from "@/components/search/SearchBar";
import { parseExploreQuery, toUrlParams } from "@/lib/explore-query";

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

  return (
    <>
      <SiteHeader bottom={<CategoryBar query={query} />}>
        {/* Keyed so the inputs reset to the URL after back/forward navigation. */}
        <SearchBar key={key} query={query} />
      </SiteHeader>
      <main className={styles.main}>
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
      <SiteHeader />
      <main className={styles.main}>
        <ListingGridSkeleton />
      </main>
    </>
  );
}
