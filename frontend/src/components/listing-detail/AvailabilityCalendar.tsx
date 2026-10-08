"use client";

import { RangeCalendar } from "@/components/ui/RangeCalendar";

import { useStay } from "./StayContext";

/** Listing calendar: the shared range picker wired to this listing's stay and booked nights. */
export function AvailabilityCalendar({ onComplete }: { onComplete?: () => void }) {
  const { today, blocked, checkIn, checkOut, setDates } = useStay();
  return (
    <RangeCalendar
      today={today}
      blocked={blocked}
      checkIn={checkIn}
      checkOut={checkOut}
      onChange={setDates}
      onComplete={onComplete}
    />
  );
}
