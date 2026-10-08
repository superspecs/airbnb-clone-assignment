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

/** "Wed, 14 Oct 2026" for a YYYY-MM-DD date. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "14 – 16 Oct 2026" style range (check-out exclusive, shown as the check-out date). */
export function dateRange(checkIn: string, checkOut: string): string {
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const endLabel = end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const sameMonth = y1 === y2 && m1 === m2;
  const startLabel = start.toLocaleDateString("en-IN", sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `${startLabel} – ${endLabel}`;
}

/** "Joined 2024" style year from an ISO timestamp. */
export function yearOf(isoTimestamp: string): number {
  return new Date(isoTimestamp).getFullYear();
}

export const PROPERTY_LABELS: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  villa: "Villa",
  cabin: "Cabin",
  cottage: "Cottage",
};

export const ROOM_LABELS: Record<string, string> = {
  entire_place: "Entire place",
  private_room: "Private room",
};
