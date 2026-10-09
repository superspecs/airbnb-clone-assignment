import { connection } from "next/server";
import { Suspense } from "react";

import { ExploreResults } from "@/components/explore/ExploreResults";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ListingGridSkeleton } from "@/components/listing/ListingGrid";
import { SectionUnavailable } from "@/components/explore/StatusMessage";
import { CategoryBar, SectionTabs } from "@/components/search/CategoryBar";
import { SearchBar } from "@/components/search/SearchBar";
import { activeSection, exploreHref, isSearchMode, parseExploreQuery, toUrlParams } from "@/lib/explore-query";

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
  const raw = await searchParams;
  // Parsing compares dates with "today", so this render must happen at request time.
  await connection();
  const query = parseExploreQuery(raw);
  const key = toUrlParams(query).toString();
  const searching = isSearchMode(query);
  const section = searching ? "homes" : activeSection(query);

  return (
    <>
      {/* Search bars are keyed so their inputs reset to the URL after back/forward navigation. */}
      {searching ? (
        // Search results: compact pill from the start, category row below, list + map.
        <SiteHeader bottom={<CategoryBar query={query} />}>
          <SearchBar key={key} query={query} collapse="always" />
        </SiteHeader>
      ) : (
        // Home: All / Homes / Experiences / Services tabs on top, large search bar below that
        // folds into the compact pill on scroll.
        <SiteHeader variant="home" tabs={<SectionTabs query={query} />}>
          <SearchBar key={key} query={query} collapse="scroll" placement="below" />
        </SiteHeader>
      )}
      <main id="main-content" tabIndex={-1} className={`${styles.main} ${searching ? "" : section === "homes" ? styles.homesMain : styles.homeMain}`}>
        {section === "experiences" || section === "services" ? (
          <SectionUnavailable
            label={section === "experiences" ? "Experiences" : "Services"}
            homesHref={exploreHref(query, { section: "homes", page: 1 })}
          />
        ) : (
          <>
            {/* Homes browsing keeps the property categories (Beachfront, Cabins, …). */}
            {!searching && section === "homes" && <CategoryBar query={query} inline />}
            <Suspense key={key} fallback={<ListingGridSkeleton />}>
              <ExploreResults query={query} />
            </Suspense>
          </>
        )}
      </main>
    </>
  );
}

function ExploreShell() {
  return (
    <>
      <SiteHeader variant="home" />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <ListingGridSkeleton />
      </main>
    </>
  );
}
