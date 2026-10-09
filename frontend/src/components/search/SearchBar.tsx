"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { MAX_GUESTS } from "@/lib/constants";
import { type ExploreQuery, exploreHref } from "@/lib/explore-query";
import { pluralize, shortDate } from "@/lib/format";
import { marketplaceToday } from "@/lib/stay";

import styles from "./SearchBar.module.css";

type Panel = "where" | "dates" | "guests" | null;

/** When the full bar collapses into the compact pill. */
export type SearchBarCollapse = "never" | "scroll" | "always";

// Scroll hysteresis so the bar doesn't flicker between states around one threshold.
const COLLAPSE_AFTER = 24;
const EXPAND_BEFORE = 4;

const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** "13–16 Nov", or "28 Nov – 2 Dec" across months. */
function compactDates(checkIn: string, checkOut: string): string {
  const day = (iso: string) => String(Number(iso.slice(8, 10)));
  const month = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
  return checkIn.slice(0, 7) === checkOut.slice(0, 7)
    ? `${day(checkIn)}–${day(checkOut)} ${month(checkOut)}`
    : `${day(checkIn)} ${month(checkIn)} – ${day(checkOut)} ${month(checkOut)}`;
}

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

interface SearchBarProps {
  query: ExploreQuery;
  collapse?: SearchBarCollapse;
  /**
   * "inline": bar and pill share the header's top row. "below": the bar sits on the homepage
   * header's own search row and the pill rises into the top row; the header itself folds
   * (it reads `data-compact`, which this component sets).
   */
  placement?: "inline" | "below";
}

export function SearchBar({ query, collapse = "never", placement = "inline" }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(query.location ?? "");
  const [checkIn, setCheckIn] = useState<string | null>(query.checkIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(query.checkOut ?? null);
  // The API filters on total guests; adults + children make up that total.
  const [adults, setAdults] = useState(query.guests ?? 0);
  const [children, setChildren] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState<string | null>(null);
  // Compact pill state: `scrolled` follows the page; `open` is the pill expanded by the user.
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guests = adults + children;
  const today = marketplaceToday();
  const compact = collapse === "always" || (collapse === "scroll" && scrolled);
  const showFull = !compact || open;

  // Homepage header folds while compact and unfolds again when the pill is opened.
  useEffect(() => {
    if (placement !== "below") return;
    const header = barRef.current?.closest("header");
    header?.toggleAttribute("data-compact", compact && !open);
  }, [placement, compact, open]);
  // One passive, rAF-throttled scroll listener: collapses the bar on scroll (home) and closes an
  // expanded pill when the page moves, like the reference.
  useEffect(() => {
    if (collapse === "never") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (collapse === "scroll") setScrolled((was) => (was ? y > EXPAND_BEFORE : y > COLLAPSE_AFTER));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [collapse]);

  useEffect(() => {
    if (!open) return;
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 60) closeAll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  function closeAll() {
    setPanel(null);
    setOpen(false);
  }

  /** Expand the compact pill and jump straight to the part the user clicked. */
  function expand(target: Panel) {
    setOpen(true);
    setPanel(target);
    if (target === "where") requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    if (!panel && !open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) closeAll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel, open]);

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
    closeAll();
    router.push(
      exploreHref(query, {
        location: location.trim() || undefined,
        checkIn: checkIn ?? undefined,
        checkOut: checkOut ?? undefined,
        guests: guests || undefined,
        section: undefined, // results are always homes
        page: 1,
      }),
    );
  }

  const guestLabel = guests ? pluralize(guests, "guest") : "Add guests";
  const place = location.trim() ? titleCase(location.trim()) : "";

  return (
    <div
      className={`${styles.wrapper} ${placement === "below" ? styles.below : ""} ${compact ? styles.isCompact : ""} ${showFull ? styles.showFull : ""} ${
        compact && open ? styles.overlay : ""
      }`}
      ref={barRef}
    >
      {/* Compact pill: place · dates · guests. Each part opens the matching part of the full bar. */}
      <div className={styles.pill} role="group" aria-label="Search" aria-hidden={showFull} inert={showFull}>
        <button type="button" className={styles.pillPart} onClick={() => expand("where")}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className={styles.pillIcon}>
            <path d="M3 11 12 4l9 7v9H3z M9.5 20v-5.5h5V20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          <span className={styles.pillPlace}>{place ? `Homes in ${place}` : "Anywhere"}</span>
        </button>
        <span className={styles.pillDivider} aria-hidden="true" />
        <button type="button" className={styles.pillPart} onClick={() => expand("dates")}>
          {checkIn && checkOut ? compactDates(checkIn, checkOut) : "Anytime"}
        </button>
        <span className={styles.pillDivider} aria-hidden="true" />
        <button type="button" className={`${styles.pillPart} ${guests ? "" : styles.pillMuted}`} onClick={() => expand("guests")}>
          {guestLabel}
        </button>
        <button type="button" className={styles.pillSearch} onClick={() => expand("where")} aria-label="Open search">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form
        role="search"
        aria-label="Search stays"
        className={`${styles.bar} ${panel ? styles.barActive : ""}`}
        onSubmit={onSubmit}
        aria-hidden={!showFull}
        inert={!showFull}
      >
        <label
          className={`${styles.segment} ${panel === "where" ? styles.active : ""}`}
          onFocus={() => setPanel("where")}
        >
          <span className={styles.label}>Where</span>
          <input
            className={styles.input}
            type="search"
            name="location"
            placeholder="Search destinations"
            ref={inputRef}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            // Escape closes the search (document handler); stop the browser clearing a search input.
            onKeyDown={(e) => e.key === "Escape" && e.preventDefault()}
            autoComplete="off"
          />
        </label>

        <button
          type="button"
          className={`${styles.segment} ${panel === "dates" ? styles.active : ""}`}
          aria-expanded={panel === "dates"}
          aria-controls="search-dates"
          onClick={() => setPanel(panel === "dates" ? null : "dates")}
        >
          <span className={styles.label}>When</span>
          <span className={checkIn ? styles.value : styles.placeholder}>
            {checkIn ? `${shortDate(checkIn)} – ${checkOut ? shortDate(checkOut) : "Add checkout"}` : "Add dates"}
          </span>
        </button>

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

      {/* Portalled so it stacks under the header (z-index 20) but over the page. */}
      {compact &&
        open &&
        createPortal(<div className={styles.backdrop} onClick={closeAll} aria-hidden="true" />, document.body)}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
