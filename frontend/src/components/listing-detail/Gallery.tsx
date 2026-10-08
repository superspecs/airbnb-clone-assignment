"use client";

import Image from "next/image";
import { useRef } from "react";

import { isOptimizableImage } from "@/lib/images";
import type { ListingImage } from "@/lib/types/listing";

import styles from "./Gallery.module.css";

/** One large photo plus up to four smaller ones; "Show all photos" opens a scrolling tour. */
export function Gallery({ images }: { images: ListingImage[] }) {
  const tourRef = useRef<HTMLDialogElement>(null);
  const shown = images.slice(0, 5);

  if (images.length === 0) return <div className={styles.empty}>No photos yet</div>;

  return (
    <>
      <div className={`${styles.grid} ${styles[`count${shown.length}`]}`}>
        {shown.map((image, i) => (
          <button
            key={image.url}
            type="button"
            className={`${styles.cell} ${i === 0 ? styles.main : ""}`}
            onClick={() => tourRef.current?.showModal()}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes={i === 0 ? "560px" : "280px"}
              preload={i === 0}
              unoptimized={!isOptimizableImage(image.url)}
              className={styles.image}
            />
          </button>
        ))}
        <button type="button" className={styles.showAll} onClick={() => tourRef.current?.showModal()}>
          Show all photos
        </button>
      </div>

      <dialog
        ref={tourRef}
        className={styles.tour}
        aria-label="All photos"
        onClick={(e) => e.target === e.currentTarget && tourRef.current?.close()}
      >
        <div className={styles.tourHeader}>
          <button type="button" className={styles.close} onClick={() => tourRef.current?.close()} aria-label="Close photos">
            ✕
          </button>
          <span>{images.length} photos</span>
        </div>
        <div className={styles.tourBody}>
          {images.map((image) => (
            <div key={image.url} className={styles.tourImage}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="900px"
                unoptimized={!isOptimizableImage(image.url)}
                className={styles.image}
              />
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
