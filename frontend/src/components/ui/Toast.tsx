"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./Toast.module.css";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

// Tiny module-level store so any client component can call toast() without a provider.
let nextId = 1;
const listeners = new Set<(item: ToastItem) => void>();

export function toast(message: string, kind: ToastKind = "success"): void {
  const item = { id: nextId++, message, kind };
  listeners.forEach((listener) => listener(item));
}

/** Messages for `?toast=<code>` after a server-side redirect. */
const URL_TOASTS: Record<string, string> = {
  booked: "Reservation confirmed (demo — no payment taken).",
  "listing-created": "Listing published.",
  "listing-updated": "Listing updated.",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setItems((current) => [...current, item]);
      setTimeout(() => setItems((current) => current.filter((t) => t.id !== item.id)), 4500);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`${styles.toast} ${styles[item.kind]}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}

/** Shows the toast named in the URL once, then strips the parameter. Render inside <Suspense>. */
export function ToastFromUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const code = params.get("toast");

  useEffect(() => {
    if (!code) return;
    const message = URL_TOASTS[code];
    if (message) toast(message);
    const rest = new URLSearchParams(params);
    rest.delete("toast");
    router.replace(rest.size ? `${pathname}?${rest}` : pathname, { scroll: false });
  }, [code, params, pathname, router]);

  return null;
}
