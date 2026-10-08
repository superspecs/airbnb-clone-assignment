"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { AMENITY_FILTERS, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/constants";
import { type ExploreQuery, activeFilterCount, exploreHref } from "@/lib/explore-query";
import type { PropertyType, RoomType } from "@/lib/types/listing";

import styles from "./FiltersModal.module.css";

interface FilterState {
  roomType?: RoomType;
  minPrice: string;
  maxPrice: string;
  minBedrooms: number;
  propertyTypes: PropertyType[];
  amenities: string[];
}

function stateFromQuery(query: ExploreQuery): FilterState {
  return {
    roomType: query.roomType,
    minPrice: query.minPrice?.toString() ?? "",
    maxPrice: query.maxPrice?.toString() ?? "",
    minBedrooms: query.minBedrooms ?? 0,
    propertyTypes: query.propertyTypes,
    amenities: query.amenities,
  };
}

const EMPTY: FilterState = { minPrice: "", maxPrice: "", minBedrooms: 0, propertyTypes: [], amenities: [] };

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const parsePrice = (value: string) => (value.trim() === "" ? undefined : Number(value));

export function FiltersButton({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<FilterState>(() => stateFromQuery(query));
  const [error, setError] = useState<string | null>(null);
  const count = activeFilterCount(query);

  function open() {
    setState(stateFromQuery(query));
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function apply() {
    const minPrice = parsePrice(state.minPrice);
    const maxPrice = parsePrice(state.maxPrice);
    const invalid = [minPrice, maxPrice].some((p) => p !== undefined && (!Number.isInteger(p) || p < 0));
    if (invalid) {
      setError("Prices must be whole numbers of rupees.");
      return;
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setError("Minimum price can't be higher than maximum price.");
      return;
    }
    close();
    router.push(
      exploreHref(query, {
        roomType: state.roomType,
        minPrice,
        maxPrice,
        minBedrooms: state.minBedrooms || undefined,
        propertyTypes: state.propertyTypes,
        amenities: state.amenities,
        page: 1,
      }),
      { scroll: false },
    );
  }

  return (
    <>
      <button type="button" className={styles.trigger} onClick={open} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 7h10 M18 7h2 M4 17h2 M10 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>Filters</span>
        {count > 0 && <span className={styles.count}>{count}</span>}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="filters-title"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className={styles.panel}>
          <header className={styles.header}>
            <button type="button" className={styles.close} onClick={close} aria-label="Close filters">
              ✕
            </button>
            <h2 id="filters-title" className={styles.title}>
              Filters
            </h2>
          </header>

          <div className={styles.body}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Type of place</h3>
              <div className={styles.segmented} role="radiogroup" aria-label="Type of place">
                {[{ value: undefined, label: "Any type" }, ...ROOM_TYPES].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={state.roomType === option.value}
                    className={styles.segment}
                    onClick={() => setState((s) => ({ ...s, roomType: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Price range</h3>
              <p className={styles.hint}>Nightly price, before fees</p>
              <div className={styles.priceRow}>
                <label className={styles.priceField}>
                  <span>Minimum (₹)</span>
                  <input
                    name="min_price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    placeholder="No min"
                    value={state.minPrice}
                    onChange={(e) => setState((s) => ({ ...s, minPrice: e.target.value }))}
                  />
                </label>
                <span aria-hidden="true">–</span>
                <label className={styles.priceField}>
                  <span>Maximum (₹)</span>
                  <input
                    name="max_price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    placeholder="No max"
                    value={state.maxPrice}
                    onChange={(e) => setState((s) => ({ ...s, maxPrice: e.target.value }))}
                  />
                </label>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Rooms</h3>
              <div className={styles.stepperRow}>
                <span>Bedrooms</span>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    onClick={() => setState((s) => ({ ...s, minBedrooms: Math.max(0, s.minBedrooms - 1) }))}
                    disabled={state.minBedrooms === 0}
                    aria-label="Fewer bedrooms"
                  >
                    −
                  </button>
                  <span className={styles.stepValue}>{state.minBedrooms ? `${state.minBedrooms}+` : "Any"}</span>
                  <button
                    type="button"
                    className={styles.stepButton}
                    onClick={() => setState((s) => ({ ...s, minBedrooms: Math.min(8, s.minBedrooms + 1) }))}
                    disabled={state.minBedrooms >= 8}
                    aria-label="More bedrooms"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Property type</h3>
              <div className={styles.chips}>
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    aria-pressed={state.propertyTypes.includes(type.value)}
                    className={styles.chip}
                    onClick={() => setState((s) => ({ ...s, propertyTypes: toggle(s.propertyTypes, type.value) }))}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Amenities</h3>
              <div className={styles.chips}>
                {AMENITY_FILTERS.map((amenity) => (
                  <button
                    key={amenity.code}
                    type="button"
                    aria-pressed={state.amenities.includes(amenity.code)}
                    className={styles.chip}
                    onClick={() => setState((s) => ({ ...s, amenities: toggle(s.amenities, amenity.code) }))}
                  >
                    {amenity.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <footer className={styles.footer}>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : (
              <button type="button" className={styles.clear} onClick={() => setState(EMPTY)}>
                Clear all
              </button>
            )}
            <button type="button" className={styles.apply} onClick={apply}>
              Show stays
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
