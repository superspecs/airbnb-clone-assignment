import type { BlockedRange } from "@/lib/types/listing";

// Calendar-date helpers on ISO "YYYY-MM-DD" strings. Arithmetic runs in UTC so the
// visitor's timezone can never shift a date. Stays are [check_in, check_out).

const toUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((toUtc(checkOut).getTime() - toUtc(checkIn).getTime()) / 86_400_000);
}

export const isIsoDate = (value: string | null | undefined): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtc(value).getTime());

/** Every booked night (the check-out day itself stays free). */
export function blockedNights(ranges: BlockedRange[]): Set<string> {
  const nights = new Set<string>();
  for (const range of ranges) {
    for (let night = range.check_in; night < range.check_out; night = addDays(night, 1)) nights.add(night);
  }
  return nights;
}

/** True when no night in [checkIn, checkOut) is booked. */
export function isStayFree(checkIn: string, checkOut: string, blocked: Set<string>): boolean {
  for (let night = checkIn; night < checkOut; night = addDays(night, 1)) {
    if (blocked.has(night)) return false;
  }
  return true;
}

/** Today's date in the marketplace timezone (matches the API's past-date rule). */
export function marketplaceToday(timeZone = "Asia/Kolkata"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

/** Calendar grid for a month: leading nulls for weekday alignment (weeks start Sunday). */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let day = 1; day <= days; day++) cells.push(toIso(new Date(Date.UTC(year, month, day))));
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
