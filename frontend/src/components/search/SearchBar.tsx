"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { MAX_GUESTS } from "@/lib/constants";
import { type ExploreQuery, exploreHref } from "@/lib/explore-query";
import { pluralize, shortDate } from "@/lib/format";
import { marketplaceToday } from "@/lib/stay";

import styles from "./SearchBar.module.css";

type Panel = "dates" | "guests" | null;

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.stepperRow}>
      <div>
        <p className={styles.stepperTitle}>{label}</p>
        <p className={styles.stepperHint}>{hint}</p>
      </div>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          −
        </button>
        <span className={styles.stepValue} aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SearchBar({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const [location, setLocation] = useState(query.location ?? "");
  const [checkIn, setCheckIn] = useState<string | null>(query.checkIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(query.checkOut ?? null);
  // The API filters on total guests; adults + children make up that total.
  const [adults, setAdults] = useState(query.guests ?? 0);
  const [children, setChildren] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const guests = adults + children;
  const today = marketplaceToday();

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  function changeChildren(next: number) {
    setChildren(next);
    if (next > 0 && adults === 0) setAdults(1); // children travel with at least one adult
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Boolean(checkIn) !== Boolean(checkOut)) {
      setError("Choose a check-out date, or clear the dates.");
      setPanel("dates");
      return;
    }
    setError(null);
    setPanel(null);
    router.push(
      exploreHref(query, {
        location: location.trim() || undefined,
        checkIn: checkIn ?? undefined,
        checkOut: checkOut ?? undefined,
        guests: guests || undefined,
        page: 1,
      }),
    );
  }

  const guestLabel = guests ? pluralize(guests, "guest") : "Add guests";

  return (
    <div className={styles.wrapper} ref={barRef}>
      <form role="search" aria-label="Search stays" className={styles.bar} onSubmit={onSubmit}>
        <label className={styles.segment} onFocus={() => setPanel(null)}>
          <span className={styles.label}>Where</span>
          <input
            className={styles.input}
            type="search"
            name="location"
            placeholder="Search destinations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="off"
          />
        </label>

        {(["Check in", "Check out"] as const).map((label) => {
          const value = label === "Check in" ? checkIn : checkOut;
          return (
            <button
              key={label}
              type="button"
              className={`${styles.segment} ${panel === "dates" ? styles.active : ""}`}
              aria-expanded={panel === "dates"}
              aria-controls="search-dates"
              onClick={() => setPanel(panel === "dates" ? null : "dates")}
            >
              <span className={styles.label}>{label}</span>
              <span className={value ? styles.value : styles.placeholder}>{value ? shortDate(value) : "Add dates"}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`${styles.segment} ${panel === "guests" ? styles.active : ""}`}
          aria-expanded={panel === "guests"}
          aria-controls="search-guests"
          onClick={() => setPanel(panel === "guests" ? null : "guests")}
        >
          <span className={styles.label}>Who</span>
          <span className={guests ? styles.value : styles.placeholder}>{guestLabel}</span>
        </button>

        <button type="submit" className={styles.submit} aria-label="Search">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {panel && <span>Search</span>}
        </button>
      </form>

      {panel === "dates" && (
        <div id="search-dates" className={`${styles.panel} ${styles.datesPanel}`} role="dialog" aria-label="Choose dates">
          <RangeCalendar
            today={today}
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(inDate, outDate) => {
              setCheckIn(inDate);
              setCheckOut(outDate);
              setError(null);
            }}
            onComplete={() => setPanel("guests")}
          />
        </div>
      )}

      {panel === "guests" && (
        <div id="search-guests" className={`${styles.panel} ${styles.guestsPanel}`} role="dialog" aria-label="Guests">
          <Stepper
            label="Adults"
            hint="Ages 13 or above"
            value={adults}
            min={children > 0 ? 1 : 0}
            max={MAX_GUESTS - children}
            onChange={setAdults}
          />
          <Stepper
            label="Children"
            hint="Ages 2–12"
            value={children}
            min={0}
            max={MAX_GUESTS - adults}
            onChange={changeChildren}
          />
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
