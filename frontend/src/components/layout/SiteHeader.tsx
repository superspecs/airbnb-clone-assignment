import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { UserMenu } from "./UserMenu";
import styles from "./SiteHeader.module.css";

function LogoMark() {
  // Original mark: a rounded roof over a doorway.
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <path d="M4 15.5 16 5l12 10.5V27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="currentColor" />
      <path d="M13 29v-7.5a3 3 0 0 1 6 0V29" fill="#fff" />
    </svg>
  );
}

/** Compact pill used on inner pages; links back to Explore. */
export function SearchShortcut() {
  return (
    <Link href="/" className={styles.shortcut}>
      <span>Start your search</span>
      <span className={styles.shortcutIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
    </Link>
  );
}

/**
 * Sticky site header: logo, a centre slot (search), the demo user menu, and an optional row
 * below (categories). Inner pages pass no children and get the compact search shortcut.
 */
export function SiteHeader({ children, bottom }: { children?: ReactNode; bottom?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Stays home">
          <LogoMark />
          <span className={styles.wordmark}>stays</span>
        </Link>
        <div className={styles.center}>{children ?? <SearchShortcut />}</div>
        <div className={styles.right}>
          <Suspense fallback={<span className={styles.menuPlaceholder} aria-hidden="true" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </header>
  );
}
