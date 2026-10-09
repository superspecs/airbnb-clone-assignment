"use client";

import { useState } from "react";

import { isStayFree, monthGrid, monthLabel } from "@/lib/stay";

import styles from "./RangeCalendar.module.css";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const NO_BLOCKED = new Set<string>();

export interface RangeCalendarProps {
  /** YYYY-MM-DD; earlier days are disabled. */
  today: string;
  /** Booked nights (YYYY-MM-DD). Omit for search, where nothing is blocked. */
  blocked?: Set<string>;
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /** Called once both dates are chosen. */
  onComplete?: () => void;
}

/**
 * Two-month range picker. Booked nights are struck through and can't start a stay; while
 * choosing check-out, only dates that keep every night free are enabled (check-out exclusive,
 * so a stay may end on the day another begins). Used by the search bar and the listing page.
 */
export function RangeCalendar({ today, blocked = NO_BLOCKED, checkIn, checkOut, onChange, onComplete }: RangeCalendarProps) {
  const setDates = onChange;
  const start = checkIn ?? today;
  const [cursor, setCursor] = useState(() => {
    const [y, m] = start.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  const [ty, tm] = today.split("-").map(Number);
  const atFirstMonth = cursor.year === ty && cursor.month === tm - 1;
  const choosingCheckOut = checkIn !== null && checkOut === null;

  function shift(delta: number) {
    setCursor(({ year, month }) => {
      const total = year * 12 + month + delta;
      return { year: Math.floor(total / 12), month: total % 12 };
    });
  }

  function canCheckOut(day: string): boolean {
    return checkIn !== null && day > checkIn && isStayFree(checkIn, day, blocked);
  }

  function onPick(day: string) {
    if (choosingCheckOut && canCheckOut(day)) {
      setDates(checkIn, day);
      onComplete?.();
      return;
    }
    setDates(day, null); // start (or restart) the range
  }

  function dayState(day: string) {
    const past = day < today;
    const bookedNight = blocked.has(day);
    const validCheckOut = choosingCheckOut && canCheckOut(day);
    let disabled: boolean;
    if (past) {
      disabled = true;
    } else if (validCheckOut) {
      disabled = false; // includes a booked night that starts right as this stay ends
    } else if (choosingCheckOut && day > checkIn!) {
      disabled = true; // would include a booked night
    } else {
      disabled = bookedNight; // picking (or re-picking) check-in
    }
    const isStart = day === checkIn;
    const isEnd = day === checkOut;
    // The chosen check-out may be another stay's first night; it is still a valid end date.
    const struck = (past || bookedNight) && !validCheckOut && !isEnd;
    const inRange = !!checkIn && !!checkOut && day > checkIn && day < checkOut;
    return { disabled, struck, isStart, isEnd, inRange };
  }

  const months = [0, 1].map((offset) => {
    const total = cursor.year * 12 + cursor.month + offset;
    return { year: Math.floor(total / 12), month: total % 12 };
  });

  return (
    <div className={styles.calendar}>
      <div className={styles.months}>
        {months.map(({ year, month }, i) => (
          <div key={`${year}-${month}`} className={styles.month}>
            <div className={styles.monthHeader}>
              {i === 0 ? (
                <button
                  type="button"
                  className={styles.nav}
                  onClick={() => shift(-1)}
                  disabled={atFirstMonth}
                  aria-label="Previous month"
                >
                  ‹
                </button>
              ) : (
                <span />
              )}
              <h3 className={styles.monthTitle}>{monthLabel(year, month)}</h3>
              {i === 1 ? (
                <button type="button" className={styles.nav} onClick={() => shift(1)} aria-label="Next month">
                  ›
                </button>
              ) : (
                <span />
              )}
            </div>
            <div className={styles.grid} role="group" aria-label={monthLabel(year, month)}>
              {WEEKDAYS.map((d) => (
                <span key={d} className={styles.weekday} aria-hidden="true">
                  {d}
                </span>
              ))}
              {monthGrid(year, month).map((day, idx) => {
                if (!day) return <span key={`blank-${idx}`} />;
                const s = dayState(day);
                const classes = [
                  styles.day,
                  s.struck ? styles.struck : "",
                  s.inRange ? styles.inRange : "",
                  s.isStart || s.isEnd ? styles.selected : "",
                  s.isStart && checkOut ? styles.rangeStart : "",
                  s.isEnd ? styles.rangeEnd : "",
                ].join(" ");
                return (
                  <button
                    key={day}
                    type="button"
                    className={classes}
                    disabled={s.disabled}
                    aria-pressed={s.isStart || s.isEnd}
                    aria-label={`${day}${s.disabled ? ", unavailable" : ""}`}
                    onClick={() => onPick(day)}
                  >
                    <span>{Number(day.slice(8))}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <p className={styles.hint}>
          {choosingCheckOut ? "Select your check-out date" : checkIn && checkOut ? "" : "Select your check-in date"}
        </p>
        <button type="button" className={styles.clear} onClick={() => setDates(null, null)} disabled={!checkIn}>
          Clear dates
        </button>
      </div>
    </div>
  );
}
