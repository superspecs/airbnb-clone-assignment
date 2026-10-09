"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./Inspiration.module.css";

export interface InspirationGroup {
  label: string;
  items: { name: string; detail: string; href: string }[];
}

const COLLAPSED = 17; // three rows of six, the last cell holding "Show more"

/** Destination links grouped into tabs (Popular, Beachfront, …), from the listings data. */
export function Inspiration({ groups }: { groups: InspirationGroup[] }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const group = groups[active];
  const items = expanded ? group.items : group.items.slice(0, COLLAPSED);

  return (
    <section className={styles.band} aria-labelledby="inspiration-heading">
      <h2 id="inspiration-heading" className={styles.title}>
        Inspiration for your next stay
      </h2>
      <div className={styles.tabs} role="tablist" aria-label="Destination ideas">
        {groups.map((g, i) => (
          <button
            key={g.label}
            type="button"
            role="tab"
            id={`inspiration-tab-${i}`}
            aria-selected={i === active}
            aria-controls="inspiration-panel"
            className={styles.tab}
            onClick={() => {
              setActive(i);
              setExpanded(false);
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
      <ul id="inspiration-panel" role="tabpanel" aria-labelledby={`inspiration-tab-${active}`} className={styles.grid}>
        {items.map((item) => (
          <li key={item.name}>
            <Link href={item.href} className={styles.link}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.detail}>{item.detail}</span>
            </Link>
          </li>
        ))}
        {!expanded && group.items.length > COLLAPSED && (
          <li>
            <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
              Show more
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
