import Link from "next/link";

import { CATEGORIES } from "@/lib/constants";
import { type ExploreQuery, exploreHref } from "@/lib/explore-query";

import { CategoryIcon } from "./CategoryIcon";
import { FiltersButton } from "./FiltersModal";
import styles from "./CategoryBar.module.css";

export function CategoryBar({ query }: { query: ExploreQuery }) {
  const items = [{ value: undefined, label: "All" }, ...CATEGORIES];

  return (
    <div className={styles.bar}>
      <nav className={styles.scroller} aria-label="Categories">
        {items.map((item) => {
          const active = query.category === item.value;
          return (
            <Link
              key={item.label}
              href={exploreHref(query, { category: item.value, page: 1 })}
              className={`${styles.item} ${active ? styles.active : ""}`}
              aria-current={active ? "page" : undefined}
              scroll={false}
            >
              <CategoryIcon category={item.value ?? "all"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <FiltersButton query={query} />
    </div>
  );
}

/** Homepage top-row tabs: the same category links, as icon-over-label tabs with an underline. */
export function CategoryTabs({ query }: { query: ExploreQuery }) {
  const items = [{ value: undefined, label: "All" }, ...CATEGORIES];
  return (
    <nav className={styles.tabs} aria-label="Categories">
      {items.map((item) => {
        const active = query.category === item.value;
        return (
          <Link
            key={item.label}
            href={exploreHref(query, { category: item.value, page: 1 })}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            aria-current={active ? "page" : undefined}
            scroll={false}
          >
            <CategoryIcon category={item.value ?? "all"} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
