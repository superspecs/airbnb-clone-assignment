"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { quoteStay } from "@/app/actions";
import { formatPrice, pluralize, shortDate } from "@/lib/format";
import type { Quote } from "@/lib/types/booking";

import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { PriceBreakdown } from "./PriceBreakdown";
import { useStay } from "./StayContext";
import styles from "./BookingWidget.module.css";

type QuoteState = { status: "idle" } | { status: "loading" } | { status: "ok"; quote: Quote } | { status: "error"; message: string };

interface BookingWidgetProps {
  nightlyPrice: number;
  currency: string;
  rating: number | null;
  reviewCount: number;
}

export function BookingWidget({ nightlyPrice, currency, rating, reviewCount }: BookingWidgetProps) {
  const { listingId, maxGuests, checkIn, checkOut, guests, setGuests } = useStay();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  // The latest server response, tagged with the stay it answers. Status is derived from it.
  const [response, setResponse] = useState<{ key: string; state: QuoteState } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stayKey = checkIn && checkOut ? `${checkIn}|${checkOut}|${guests}` : null;
  const quote: QuoteState =
    stayKey === null ? { status: "idle" } : response?.key === stayKey ? response.state : { status: "loading" };

  // Ask the server for an authoritative price whenever the stay changes.
  useEffect(() => {
    if (!stayKey || !checkIn || !checkOut) return;
    let cancelled = false;
    quoteStay(listingId, { checkIn, checkOut, guests }).then((result) => {
      if (cancelled) return;
      setResponse({
        key: stayKey,
        state: result.ok ? { status: "ok", quote: result.data } : { status: "error", message: result.error },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, stayKey, checkIn, checkOut, guests]);

  useEffect(() => {
    if (!calendarOpen && !guestsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        setCalendarOpen(false);
        setGuestsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCalendarOpen(false);
        setGuestsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [calendarOpen, guestsOpen]);

  const ready = quote.status === "ok";
  const reserveHref = ready
    ? `/listings/${listingId}/book?${new URLSearchParams({ check_in: checkIn!, check_out: checkOut!, guests: String(guests) })}`
    : null;

  return (
    <aside id="booking-widget" className={styles.card} aria-label="Reserve this place">
      <div className={styles.priceLine}>
        {ready ? (
          <p>
            <strong className={styles.price}>{formatPrice(quote.quote.price.total, currency)}</strong>{" "}
            for {pluralize(quote.quote.price.nights, "night")}
          </p>
        ) : (
          <p>
            <strong className={styles.price}>{formatPrice(nightlyPrice, currency)}</strong> night
          </p>
        )}
        {rating !== null && (
          <span className={styles.rating}>
            ★ {rating.toFixed(2)} · {pluralize(reviewCount, "review")}
          </span>
        )}
      </div>

      <div className={styles.fields} ref={panelRef}>
        <div className={styles.dates}>
          {(["check-in", "checkout"] as const).map((kind) => {
            const value = kind === "check-in" ? checkIn : checkOut;
            return (
              <button
                key={kind}
                type="button"
                className={styles.field}
                aria-expanded={calendarOpen}
                onClick={() => {
                  setGuestsOpen(false);
                  setCalendarOpen((o) => !o);
                }}
              >
                <span className={styles.fieldLabel}>{kind === "check-in" ? "CHECK-IN" : "CHECKOUT"}</span>
                <span className={value ? "" : styles.placeholder}>{value ? shortDate(value) : "Add date"}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={`${styles.field} ${styles.guestsField}`}
          aria-expanded={guestsOpen}
          onClick={() => {
            setCalendarOpen(false);
            setGuestsOpen((o) => !o);
          }}
        >
          <span className={styles.fieldLabel}>GUESTS</span>
          <span>{pluralize(guests, "guest")}</span>
        </button>

        {calendarOpen && (
          <div className={`${styles.popover} ${styles.calendarPopover}`} role="dialog" aria-label="Choose dates">
            <AvailabilityCalendar onComplete={() => setCalendarOpen(false)} />
          </div>
        )}

        {guestsOpen && (
          <div className={`${styles.popover} ${styles.guestsPopover}`} role="dialog" aria-label="Guests">
            <div className={styles.stepperRow}>
              <div>
                <p className={styles.stepperTitle}>Guests</p>
                <p className={styles.muted}>This place allows up to {maxGuests}</p>
              </div>
              <div className={styles.stepper}>
                <button
                  type="button"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                  aria-label="Fewer guests"
                >
                  −
                </button>
                <span aria-live="polite">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                  disabled={guests >= maxGuests}
                  aria-label="More guests"
                >
                  +
                </button>
              </div>
            </div>
            <button type="button" className={styles.closeLink} onClick={() => setGuestsOpen(false)}>
              Close
            </button>
          </div>
        )}
      </div>

      {reserveHref ? (
        <Link href={reserveHref} className={styles.reserve}>
          Reserve
        </Link>
      ) : (
        <button
          type="button"
          className={styles.reserve}
          disabled={quote.status === "loading" || quote.status === "error"}
          onClick={() => setCalendarOpen(true)}
        >
          {quote.status === "loading" ? "Checking availability…" : "Check availability"}
        </button>
      )}

      {quote.status === "error" && (
        <p className={styles.error} role="alert">
          {quote.message}
        </p>
      )}
      {ready && (
        <>
          <p className={styles.note}>You won&apos;t be charged — checkout is a demo.</p>
          <PriceBreakdown price={quote.quote.price} />
        </>
      )}
    </aside>
  );
}
