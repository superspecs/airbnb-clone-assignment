"use client";

import { dateRange, pluralize } from "@/lib/format";
import { nightsBetween } from "@/lib/stay";

import { AvailabilityCalendar } from "./AvailabilityCalendar";
import styles from "./Sections.module.css";
import { useStay } from "./StayContext";

/** Inline availability calendar in the page body; shares its selection with the widget. */
export function CalendarSection({ city }: { city: string }) {
  const { checkIn, checkOut } = useStay();
  const complete = checkIn && checkOut;
  return (
    <section className={styles.section} id="availability">
      <h2 className={styles.heading} style={{ marginBottom: 4 }}>
        {complete ? `${pluralize(nightsBetween(checkIn, checkOut), "night")} in ${city}` : "Select check-in date"}
      </h2>
      <p className={styles.muted} style={{ marginBottom: 20 }}>
        {complete ? dateRange(checkIn, checkOut) : "Add your travel dates for exact pricing. Booked nights are crossed out."}
      </p>
      <AvailabilityCalendar />
    </section>
  );
}
