import Link from "next/link";
import type { ReactNode } from "react";

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

/** Sticky site header: logo, a centre slot (search), and an optional row below (categories). */
export function SiteHeader({ children, bottom }: { children?: ReactNode; bottom?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Stays home">
          <LogoMark />
          <span className={styles.wordmark}>stays</span>
        </Link>
        <div className={styles.center}>{children}</div>
        <p className={styles.badge}>Demo marketplace</p>
      </div>
      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </header>
  );
}
