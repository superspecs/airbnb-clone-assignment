const formatters = new Map<string, Intl.NumberFormat>();

/** Format integer minor units (e.g. paise) as a whole-unit currency string, e.g. ₹3,800. */
export function formatPrice(minorUnits: number, currency: string): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });
    formatters.set(currency, formatter);
  }
  return formatter.format(minorUnits / 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Today's date in the browser's local timezone as YYYY-MM-DD. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "13 Nov" style label for a YYYY-MM-DD date (parsed as a calendar date, not UTC). */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
