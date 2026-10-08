"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { MAX_GUESTS } from "@/lib/constants";
import { type ExploreQuery, exploreHref } from "@/lib/explore-query";
import { pluralize, todayIso } from "@/lib/format";

import styles from "./SearchBar.module.css";

export function SearchBar({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const [location, setLocation] = useState(query.location ?? "");
  const [checkIn, setCheckIn] = useState(query.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(query.checkOut ?? "");
  const [guests, setGuests] = useState(query.guests ?? 0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!guestsRef.current?.contains(event.target as Node)) setGuestsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGuestsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [guestsOpen]);

  function onCheckInChange(value: string) {
    setCheckIn(value);
    if (checkOut && value && checkOut <= value) setCheckOut("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Boolean(checkIn) !== Boolean(checkOut)) {
      setError("Add both a check-in and a check-out date, or leave both empty.");
      return;
    }
    if (checkIn && checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (checkIn && checkIn < todayIso()) {
      setError("Check-in can't be in the past.");
      return;
    }
    setError(null);
    setGuestsOpen(false);
    router.push(
      exploreHref(query, {
        location: location.trim() || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: guests || undefined,
        page: 1,
      }),
    );
  }

  const today = todayIso();

  return (
    <div className={styles.wrapper}>
      <form role="search" aria-label="Search stays" className={styles.bar} onSubmit={onSubmit}>
        <label className={`${styles.segment} ${styles.where}`}>
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

        <label className={styles.segment}>
          <span className={styles.label}>Check in</span>
          <input
            className={styles.input}
            type="date"
            name="check_in"
            min={today}
            value={checkIn}
            onChange={(e) => onCheckInChange(e.target.value)}
            suppressHydrationWarning
          />
        </label>

        <label className={styles.segment}>
          <span className={styles.label}>Check out</span>
          <input
            className={styles.input}
            type="date"
            name="check_out"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            suppressHydrationWarning
          />
        </label>

        <div className={`${styles.segment} ${styles.who}`} ref={guestsRef}>
          <button
            type="button"
            className={styles.whoButton}
            aria-expanded={guestsOpen}
            aria-controls="guest-picker"
            onClick={() => setGuestsOpen((open) => !open)}
          >
            <span className={styles.label}>Who</span>
            <span className={guests ? styles.value : styles.placeholder}>
              {guests ? pluralize(guests, "guest") : "Add guests"}
            </span>
          </button>

          {guestsOpen && (
            <div id="guest-picker" className={styles.popover} role="group" aria-label="Guests">
              <div className={styles.stepperRow}>
                <div>
                  <p className={styles.stepperTitle}>Guests</p>
                  <p className={styles.stepperHint}>Adults and children</p>
                </div>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    onClick={() => setGuests((g) => Math.max(0, g - 1))}
                    disabled={guests === 0}
                    aria-label="Decrease guests"
                  >
                    −
                  </button>
                  <span className={styles.stepValue} aria-live="polite">
                    {guests}
                  </span>
                  <button
                    type="button"
                    className={styles.stepButton}
                    onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                    disabled={guests >= MAX_GUESTS}
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className={styles.submit}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Search</span>
        </button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
