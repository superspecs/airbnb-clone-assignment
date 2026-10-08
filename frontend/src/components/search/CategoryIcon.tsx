import type { Category } from "@/lib/types/listing";

// Simple original line icons for the category row.
const PATHS: Record<Category | "all", string> = {
  all: "M4 11 12 4l8 7v9H4z M10 20v-5h4v5",
  beachfront: "M3 18c2 0 2-1.5 4.5-1.5S10 18 12 18s2-1.5 4.5-1.5S19 18 21 18 M12 14V5 M12 5c-3 0-6 2-7 5h14c-1-3-4-5-7-5",
  amazing_pools: "M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2-1.5 4.5-1.5S19 17 21 17 M3 21c2 0 2-1.5 4.5-1.5S10 21 12 21s2-1.5 4.5-1.5S19 21 21 21 M8 14V5a2 2 0 0 1 4 0 M16 14V5a2 2 0 0 0-4 0 M8 9h8",
  cabins: "M3 12 12 4l9 8 M5 10.5V20h14v-9.5 M10 20v-5h4v5 M8 13h0 M16 13h0",
  mountain_views: "M2 20 9 8l4 6 3-4 6 10z M7.5 10.5 9 12l1.5-1.5",
  city_stays: "M4 20V8h6v12 M10 20V4h8v16 M3 20h18 M13 8h2 M13 12h2 M13 16h2 M6 11h2 M6 15h2",
  countryside: "M3 20h18 M6 20v-6l5-4 5 4v6 M18 20v-9 M18 11c-2 0-3-1.5-3-3.5S16 4 18 4s3 1.5 3 3.5S20 11 18 11",
  lakefront: "M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2-1.5 4.5-1.5S19 16 21 16 M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2-1.5 4.5-1.5S19 20 21 20 M6 12l4-7 4 7z M10 12V5",
};

export function CategoryIcon({ category }: { category: Category | "all" }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d={PATHS[category]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
