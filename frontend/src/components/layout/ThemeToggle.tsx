"use client";

import { useSyncExternalStore } from "react";

import { getTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

import styles from "./ThemeToggle.module.css";

/** Header button that switches between light and dark mode. */
export function ThemeToggle() {
  // The server can't know the visitor's theme, so it renders a neutral button (null) and the
  // client fills in the real state right after hydration, without a mismatch warning.
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, getTheme, () => null);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={theme === null ? undefined : dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(getTheme() === "dark" ? "light" : "dark")}
    >
      <span className="visually-hidden">Dark mode</span>
      {/* Both icons render; CSS shows the one for the theme that is active right now. */}
      <svg className={styles.moon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor" />
      </svg>
      <svg className={styles.sun} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <path
          d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
