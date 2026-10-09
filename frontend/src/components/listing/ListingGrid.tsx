"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { formatPrice, PROPERTY_LABELS } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import type { ListingCard as ListingCardData } from "@/lib/types/listing";

import { ListingCard } from "./ListingCard";
import styles from "./ListingGrid.module.css";

const ABOVE_THE_FOLD = 4;

interface ListingGridProps {
  listings: ListingCardData[];
  savedIds?: number[];
  linkQuery?: string;
  nights?: number;
  variant?: "grid" | "split";
  /** Listing whose card is outlined (its map marker is selected). */
  highlightedId?: number | null;
  /** Card hover, reported so the matching map marker can be highlighted. */
  onHover?: (id: number | null) => void;
}

export function ListingGrid({
  listings,
  savedIds = [],
  linkQuery,
  nights,
  variant = "grid",
  highlightedId = null,
  onHover,
}: ListingGridProps) {
  const saved = new Set(savedIds);
  return (
    <>
      {/* Keeps headings in order (page h1 → this h2 → card h3) for screen readers. */}
      <h2 className="visually-hidden">Stays</h2>
      <ul className={`${styles.grid} ${variant === "split" ? styles.splitGrid : ""}`}>
        {listings.map((listing, i) => (
          <li key={listing.id} id={`listing-${listing.id}`}>
            <ListingCard
              listing={listing}
              preloadImage={i < ABOVE_THE_FOLD}
              initiallySaved={saved.has(listing.id)}
              linkQuery={linkQuery}
              nights={nights}
              variant={variant}
              highlighted={highlightedId === listing.id}
              onHoverChange={onHover && ((hovering) => onHover(hovering ? listing.id : null))}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

interface ListingsWithMapProps extends Omit<ListingGridProps, "variant" | "highlightedId" | "onHover"> {
  /** Results heading and the note beside it, above the list column. */
  title: string;
  note: string;
  /** Pagination, rendered under the list. */
  footer?: ReactNode;
}

/**
 * Search results: list beside a map with price markers. Hovering a card highlights its marker;
 * selecting a marker opens a preview on the map and outlines (and scrolls to) its card.
 */
export function ListingsWithMap({ title, note, footer, ...grid }: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  function select(id: number | null) {
    setSelectedId(id);
    if (id !== null && !expanded) {
      document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <div className={`${styles.split} ${expanded ? styles.mapExpanded : ""}`}>
      <section aria-labelledby="results-heading" className={styles.listColumn} hidden={expanded}>
        <div className={styles.resultsHeading}>
          <h1 id="results-heading" className={styles.resultsTitle}>
            {title}
          </h1>
          <p className={styles.resultsNote}>{note}</p>
        </div>
        <ListingGrid {...grid} variant="split" highlightedId={selectedId} onHover={setHoveredId} />
        {footer}
      </section>
      <ResultsMap
        items={grid.listings}
        linkQuery={grid.linkQuery ?? ""}
        nights={grid.nights}
        hoveredId={hoveredId}
        selectedId={selectedId}
        onSelect={select}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((e) => !e)}
      />
    </div>
  );
}

const TILE = 256;
const PADDING = 64; // keep markers away from the map edges when fitting

/** Web Mercator: world pixel coordinates at zoom `z`. */
function project(lat: number, lng: number, z: number) {
  const scale = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** Largest zoom (and centre) at which every listing fits inside the map box. */
function fitView(items: ListingCardData[], width: number, height: number) {
  let z = 13;
  if (items.length > 1) {
    for (z = 15; z > 3; z--) {
      const pts = items.map((i) => project(i.latitude, i.longitude, z));
      const spanX = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
      const spanY = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
      if (spanX <= width - 2 * PADDING && spanY <= height - 2 * PADDING) break;
    }
  }
  const pts = items.map((i) => project(i.latitude, i.longitude, z));
  return {
    z,
    cx: (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2,
    cy: (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2,
  };
}

interface ResultsMapProps {
  items: ListingCardData[];
  linkQuery: string;
  nights?: number;
  hoveredId: number | null;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

/**
 * Basic interactive map without a map library or API key: OpenStreetMap raster tiles positioned
 * with Web Mercator maths, draggable, with zoom buttons and price markers.
 */
function ResultsMap({ items, linkQuery, nights, hoveredId, selectedId, onSelect, expanded, onToggleExpanded }: ResultsMapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // null = fitted to the results; set once the user pans or zooms.
  const [view, setView] = useState<{ z: number; cx: number; cy: number } | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onSelect(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, onSelect]);

  const current = view ?? (size && items.length ? fitView(items, size.w, size.h) : null);

  function zoom(delta: number) {
    if (!current) return;
    const z = Math.min(17, Math.max(3, current.z + delta));
    const f = 2 ** (z - current.z);
    setView({ z, cx: current.cx * f, cy: current.cy * f });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!current || e.button !== 0 || (e.target as HTMLElement).closest("button, a")) return;
    drag.current = { x: e.clientX, y: e.clientY, cx: current.cx, cy: current.cy, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    setView({ z: current.z, cx: d.cx - dx, cy: d.cy - dy });
  }

  function onPointerUp() {
    // A click (no drag) on empty map closes the preview, like the reference.
    if (drag.current && !drag.current.moved) onSelect(null);
    drag.current = null;
  }

  let layer: ReactNode = null;
  let preview: ReactNode = null;
  if (size && current) {
    const left = Math.round(current.cx - size.w / 2);
    const top = Math.round(current.cy - size.h / 2);
    const n = 2 ** current.z;
    const tiles: ReactNode[] = [];
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + size.w) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + size.h) / TILE); ty++) {
        if (ty < 0 || ty >= n) continue;
        tiles.push(
          // eslint-disable-next-line @next/next/no-img-element -- map tiles are plain positioned images
          <img
            key={`${current.z}-${tx}-${ty}`}
            className={styles.tile}
            src={`https://tile.openstreetmap.org/${current.z}/${((tx % n) + n) % n}/${ty}.png`}
            alt=""
            draggable={false}
            style={{ left: tx * TILE - left, top: ty * TILE - top }}
          />,
        );
      }
    }

    const positioned = items.map((item) => {
      const p = project(item.latitude, item.longitude, current.z);
      return { item, x: p.x - left, y: p.y - top };
    });
    // Draw the hovered/selected marker last so it sits on top of overlapping neighbours.
    const order = [...positioned].sort(
      (a, b) => Number(a.item.id === hoveredId || a.item.id === selectedId) - Number(b.item.id === hoveredId || b.item.id === selectedId),
    );

    layer = (
      <>
        {tiles}
        {order.map(({ item, x, y }) => {
          const price = formatPrice(nights ? item.nightly_price * nights : item.nightly_price, item.currency);
          const state = item.id === selectedId ? styles.markerSelected : item.id === hoveredId ? styles.markerHovered : "";
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.marker} ${state}`}
              style={{ left: x, top: y }}
              aria-pressed={item.id === selectedId}
              aria-label={`${item.title}, ${price}`}
              onClick={() => onSelect(item.id === selectedId ? null : item.id)}
            >
              {price}
            </button>
          );
        })}
      </>
    );

    const chosen = positioned.find((p) => p.item.id === selectedId);
    if (chosen) {
      const cardW = 300;
      const cardH = 300;
      const above = chosen.y - 24 > cardH;
      const x = Math.min(Math.max(chosen.x - cardW / 2, 12), size.w - cardW - 12);
      const y = above ? chosen.y - 22 - cardH : Math.min(chosen.y + 22, size.h - cardH - 12);
      preview = (
        <MapPreview
          listing={chosen.item}
          href={`/listings/${chosen.item.id}${linkQuery ? `?${linkQuery}` : ""}`}
          nights={nights}
          style={{ left: x, top: y, width: cardW }}
          onClose={() => onSelect(null)}
        />
      );
    }
  }

  return (
    <div
      className={styles.map}
      ref={boxRef}
      role="region"
      aria-label="Map of results"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
    >
      {layer}
      {preview}
      <button
        type="button"
        className={`${styles.mapButton} ${styles.expandButton}`}
        onClick={onToggleExpanded}
        aria-label={expanded ? "Show list" : "Expand map"}
        aria-pressed={expanded}
      >
        {expanded ? (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className={styles.zoom}>
        <button type="button" onClick={() => zoom(1)} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        © OpenStreetMap contributors
      </a>
    </div>
  );
}

function MapPreview({
  listing,
  href,
  nights,
  style,
  onClose,
}: {
  listing: ListingCardData;
  href: string;
  nights?: number;
  style: CSSProperties;
  onClose: () => void;
}) {
  const image = listing.images[0];
  const kind = listing.room_type === "private_room" ? "Room" : (PROPERTY_LABELS[listing.property_type] ?? "Stay");
  return (
    <div className={styles.preview} style={style} role="dialog" aria-label={`${kind} in ${listing.city}`}>
      <Link href={href} className={styles.previewLink}>
        <div className={styles.previewMedia}>
          {image && (
            <Image src={image.url} alt={image.alt} fill sizes="300px" unoptimized={!isOptimizableImage(image.url)} className={styles.previewImage} />
          )}
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewTop}>
            <strong>
              {kind} in {listing.city}
            </strong>
            {listing.rating !== null && (
              <span>
                ★ {listing.rating.toFixed(2)} ({listing.review_count})
              </span>
            )}
          </div>
          <p className={styles.previewTitle}>{listing.title}</p>
          <p className={styles.previewPrice}>
            <strong>{formatPrice(nights ? listing.nightly_price * nights : listing.nightly_price, listing.currency)}</strong>{" "}
            {nights ? `for ${nights} ${nights === 1 ? "night" : "nights"}` : "night"}
          </p>
        </div>
      </Link>
      <button type="button" className={styles.previewClose} onClick={onClose} aria-label="Close preview">
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

interface ListingCarouselProps {
  id: string;
  title: string;
  subtitle: string;
  /** Where the heading's arrow leads (e.g. that destination's search results). */
  href?: string;
  listings: ListingCardData[];
  savedIds?: number[];
  /** Preload the first cards' photos (first section on the page). */
  eager?: boolean;
}

/** Homepage section: heading with arrow link, previous/next controls and a scrolling card row. */
export function ListingCarousel({ id, title, subtitle, href, listings, savedIds = [], eager = false }: ListingCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const saved = new Set(savedIds);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () =>
      setEdges({
        start: track.scrollLeft <= 1,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <div>
          <h2 id={id} className={styles.sectionTitle}>
            {href ? (
              <Link href={href} className={styles.sectionLink}>
                {title}
                <span className={styles.sectionArrow} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12">
                    <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ) : (
              title
            )}
          </h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        <div className={styles.sectionNav}>
          <button type="button" onClick={() => page(-1)} disabled={edges.start} aria-label={`Previous: ${title}`}>
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={() => page(1)} disabled={edges.end} aria-label={`Next: ${title}`}>
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <ul className={styles.track} ref={trackRef}>
        {listings.map((listing, i) => (
          <li key={listing.id}>
            <ListingCard
              listing={listing}
              variant="compact"
              preloadImage={eager && i < 7}
              initiallySaved={saved.has(listing.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading stays…</span>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.short}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
