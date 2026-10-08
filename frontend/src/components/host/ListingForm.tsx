"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";

import { saveHostListing } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import { CATEGORIES, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/constants";
import { isOptimizableImage } from "@/lib/images";
import type { HostListingDetail, ListingInput } from "@/lib/types/host";
import type { Amenity, Category, PropertyType, RoomType } from "@/lib/types/listing";

import styles from "./ListingForm.module.css";

type FormValues = Record<
  | "title" | "description" | "address" | "city" | "state" | "country" | "latitude" | "longitude"
  | "nightlyPrice" | "cleaningFee" | "maxGuests" | "bedrooms" | "beds" | "bathrooms" | "imageUrls",
  string
> & { propertyType: PropertyType; roomType: RoomType; category: Category; amenities: string[] };

function initialValues(listing?: HostListingDetail): FormValues {
  return {
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    propertyType: listing?.property_type ?? "apartment",
    roomType: listing?.room_type ?? "entire_place",
    category: listing?.category ?? "city_stays",
    address: listing?.address ?? "",
    city: listing?.city ?? "",
    state: listing?.state ?? "",
    country: listing?.country ?? "India",
    latitude: String(listing?.latitude ?? "15.4909"),
    longitude: String(listing?.longitude ?? "73.8278"),
    nightlyPrice: listing ? String(listing.nightly_price / 100) : "",
    cleaningFee: listing ? String(listing.cleaning_fee / 100) : "0",
    maxGuests: String(listing?.max_guests ?? 2),
    bedrooms: String(listing?.bedrooms ?? 1),
    beds: String(listing?.beds ?? 1),
    bathrooms: String(listing?.bathrooms ?? 1),
    amenities: listing?.amenities ?? ["wifi"],
    imageUrls: listing?.image_urls.join("\n") ?? "",
  };
}

function toPayload(v: FormValues): ListingInput {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    property_type: v.propertyType,
    room_type: v.roomType,
    category: v.category,
    address: v.address.trim(),
    city: v.city.trim(),
    state: v.state.trim(),
    country: v.country.trim(),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude),
    // Rupees in the form, paise in the API.
    nightly_price: Math.round(Number(v.nightlyPrice) * 100),
    cleaning_fee: Math.round(Number(v.cleaningFee || 0) * 100),
    max_guests: Number(v.maxGuests),
    bedrooms: Number(v.bedrooms),
    beds: Number(v.beds),
    bathrooms: Number(v.bathrooms),
    amenities: v.amenities,
    image_urls: v.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean),
  };
}

interface ListingFormProps {
  amenities: Amenity[];
  listing?: HostListingDetail;
}

export function ListingForm({ amenities, listing }: ListingFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(listing));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const previewUrls = values.imageUrls
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("https://"))
    .slice(0, 10);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveHostListing(listing?.id ?? null, toPayload(values));
      if (result && !result.ok) {
        setError(result.error);
        toast("Please fix the highlighted problems.", "error");
      }
    });
  }

  const text = (key: keyof FormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        name={key}
        value={values[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </label>
  );

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate={false}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Basics</legend>
        {text("title", "Title", { required: true, minLength: 5, maxLength: 120, placeholder: "Sunny loft near the beach" })}
        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea
            className={styles.textarea}
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={5}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What makes your place special? (at least 20 characters)"
          />
        </label>
        <div className={styles.row3}>
          <label className={styles.field}>
            <span className={styles.label}>Property type</span>
            <select className={styles.input} value={values.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)}>
              {PROPERTY_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Type of place</span>
            <select className={styles.input} value={values.roomType} onChange={(e) => set("roomType", e.target.value as RoomType)}>
              {ROOM_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select className={styles.input} value={values.category} onChange={(e) => set("category", e.target.value as Category)}>
              {CATEGORIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Location</legend>
        <div className={styles.row2}>
          {text("address", "Area / neighbourhood", { required: true, placeholder: "Candolim" })}
          {text("city", "City", { required: true, placeholder: "Goa" })}
        </div>
        <div className={styles.row2}>
          {text("state", "State", { required: true })}
          {text("country", "Country", { required: true })}
        </div>
        <div className={styles.row2}>
          {text("latitude", "Latitude", { type: "number", step: "any", min: -90, max: 90, required: true })}
          {text("longitude", "Longitude", { type: "number", step: "any", min: -180, max: 180, required: true })}
        </div>
        <p className={styles.hint}>Coordinates place the map pin on the listing page.</p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Price and capacity</legend>
        <div className={styles.row2}>
          {text("nightlyPrice", "Nightly price (₹)", { type: "number", min: 100, step: 1, required: true })}
          {text("cleaningFee", "Cleaning fee (₹)", { type: "number", min: 0, step: 1 })}
        </div>
        <div className={styles.row4}>
          {text("maxGuests", "Max guests", { type: "number", min: 1, max: 16, required: true })}
          {text("bedrooms", "Bedrooms", { type: "number", min: 0, max: 20, required: true })}
          {text("beds", "Beds", { type: "number", min: 1, max: 30, required: true })}
          {text("bathrooms", "Bathrooms", { type: "number", min: 0, max: 20, step: 0.5, required: true })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Amenities</legend>
        <div className={styles.chips}>
          {amenities.map((amenity) => {
            const on = values.amenities.includes(amenity.code);
            return (
              <button
                key={amenity.code}
                type="button"
                className={styles.chip}
                aria-pressed={on}
                onClick={() =>
                  set("amenities", on ? values.amenities.filter((c) => c !== amenity.code) : [...values.amenities, amenity.code])
                }
              >
                {amenity.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Photos</legend>
        <label className={styles.field}>
          <span className={styles.label}>Photo URLs — one https:// link per line, up to 10. The first is the cover.</span>
          <textarea
            className={styles.textarea}
            name="image_urls"
            required
            rows={4}
            value={values.imageUrls}
            onChange={(e) => set("imageUrls", e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
          />
        </label>
        {previewUrls.length > 0 && (
          <div className={styles.previews}>
            {previewUrls.map((url, i) => (
              <div key={`${url}-${i}`} className={styles.preview}>
                <Image src={url} alt={`Photo ${i + 1} preview`} fill sizes="120px" unoptimized={!isOptimizableImage(url)} className={styles.previewImage} />
                {i === 0 && <span className={styles.coverTag}>Cover</span>}
              </div>
            ))}
          </div>
        )}
        <p className={styles.hint}>Image upload to cloud storage is not part of this demo; paste links to hosted photos.</p>
      </fieldset>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.footer}>
        <Link href="/host" className={styles.cancel}>
          Cancel
        </Link>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Saving…" : listing ? "Save changes" : "Publish listing"}
        </button>
      </div>
    </form>
  );
}
