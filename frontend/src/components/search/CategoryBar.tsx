import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";

import { CATEGORIES } from "@/lib/constants";
import { type ExploreQuery, type Section, activeSection, exploreHref } from "@/lib/explore-query";

import { CategoryIcon } from "./CategoryIcon";
import { FiltersButton } from "./FiltersModal";
import styles from "./CategoryBar.module.css";

/** Property-category row with Filters. `inline`: placed in the Homes view's content. */
export function CategoryBar({ query, inline = false }: { query: ExploreQuery; inline?: boolean }) {
  const items = [{ value: undefined, label: "All" }, ...CATEGORIES];

  return (
    <div className={`${styles.bar} ${inline ? styles.inline : ""}`}>
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

interface SectionTab {
  value: Section | "all";
  label: string;
  /** Half the PNG's pixel size (2x art), which matches the reference artwork. */
  icon: { width: number; height: number };
  /** Placement measured from the reference at 1440px: icon slot width (art centred in it),
   *  space before the control, vertical nudge for the art, and where the underline starts. */
  slot: number;
  before: number;
  dy: number;
  underline: number;
}

const SECTION_TABS: SectionTab[] = [
  { value: "all", label: "All", icon: { width: 33, height: 40.5 }, slot: 42, before: 0, dy: 0, underline: 6 },
  { value: "homes", label: "Homes", icon: { width: 43.5, height: 37 }, slot: 46, before: 43, dy: -2, underline: 2 },
  { value: "experiences", label: "Experiences", icon: { width: 28, height: 38 }, slot: 36, before: 34, dy: 0, underline: 5 },
  { value: "services", label: "Services", icon: { width: 42, height: 32 }, slot: 40, before: 35, dy: 0, underline: 0 },
];

/**
 * Homepage top-row tabs: All (overview), Homes (listing browse), Experiences and Services
 * (not part of this demo; they open a "not available yet" view). Selection lives in the URL.
 */
export function SectionTabs({ query }: { query: ExploreQuery }) {
  const current = activeSection(query);
  return (
    <nav className={styles.sections} aria-label="Browse">
      {SECTION_TABS.map(({ value, label, icon, slot, before, dy, underline }) => {
        const active = current === value;
        const href = value === "all" ? "/" : exploreHref(query, { section: value, category: undefined, page: 1 });
        return (
          <Link
            key={value}
            href={href}
            className={`${styles.section} ${active ? styles.sectionActive : ""}`}
            style={
              {
                "--tab-slot": `${slot}px`,
                "--tab-before": `${before}px`,
                "--tab-dy": `${dy}px`,
                "--tab-underline": `${underline}px`,
              } as CSSProperties
            }
            aria-current={active ? "page" : undefined}
            scroll={false}
          >
            <span className={styles.sectionIcon} aria-hidden="true">
              <Image src={`/icons/category-${value}.png`} alt="" width={icon.width} height={icon.height} unoptimized />
            </span>
            <span className={styles.sectionLabel}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
