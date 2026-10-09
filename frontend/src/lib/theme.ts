// Light/dark theme. The choice lives in localStorage and is applied as <html data-theme="…">.
// THEME_SCRIPT runs inline in <head> before first paint, so there is no flash of the wrong theme.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "stays-theme";

/**
 * Inline, render-blocking: the saved choice, else the OS preference. Kept tiny and static
 * (no user data is interpolated), and any storage error falls back to light.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

const listeners = new Set<() => void>();

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies for this page view.
  }
  listeners.forEach((listener) => listener());
}

/** For useSyncExternalStore: re-render toggles when the theme changes (in this or another tab). */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY || (event.newValue !== "light" && event.newValue !== "dark")) return;
    document.documentElement.dataset.theme = event.newValue;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
