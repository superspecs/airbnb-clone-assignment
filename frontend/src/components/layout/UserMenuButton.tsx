"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { switchDemoUser } from "@/app/actions";
import { toast } from "@/components/ui/Toast";
import type { DemoUser } from "@/lib/types/user";

import { Avatar } from "./Avatar";
import styles from "./UserMenu.module.css";

export function UserMenuButton({ current, users }: { current: DemoUser | null; users: DemoUser[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(user: DemoUser) {
    setOpen(false);
    startTransition(async () => {
      await switchDemoUser(user.id);
      toast(`Now browsing as ${user.name} (${user.is_host ? "host" : "guest"}).`, "info");
    });
  }

  const hosts = users.filter((u) => u.is_host);
  const guests = users.filter((u) => !u.is_host);

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Host entry: hosts go to their dashboard; guests see the host gate (pick a demo host). */}
      <Link href="/host" className={styles.hostLink}>
        {current?.is_host ? "Switch to hosting" : "Become a host"}
      </Link>
      <button
        type="button"
        className={styles.circle}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
      >
        <Avatar name={current?.name ?? "?"} size={32} />
        {/* Name as text (not aria-label) so it doesn't conflict with the visible initials. */}
        <span className="visually-hidden">{current ? `Profile, signed in as ${current.name}` : "Profile"}</span>
      </button>
      <button
        type="button"
        className={styles.circle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Main menu"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {current && (
            <div className={styles.identity}>
              <p className={styles.name}>{current.name}</p>
              <p className={styles.muted}>
                Demo {current.is_host ? "host" : "guest"} · mock sign-in
              </p>
            </div>
          )}
          <nav className={styles.links}>
            <Link href="/trips" role="menuitem" onClick={() => setOpen(false)}>
              Trips
            </Link>
            <Link href="/wishlists" role="menuitem" onClick={() => setOpen(false)}>
              Wishlists
            </Link>
            {current?.is_host && (
              <>
                <Link href="/host" role="menuitem" onClick={() => setOpen(false)}>
                  Host dashboard
                </Link>
                <Link href="/host/listings/new" role="menuitem" onClick={() => setOpen(false)}>
                  Create a listing
                </Link>
              </>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                toast("Messages are coming soon.", "info");
              }}
            >
              Messages <span className={styles.soon}>Coming soon</span>
            </button>
          </nav>
          <div className={styles.switcher}>
            <p className={styles.sectionLabel}>Switch demo user</p>
            {[
              { label: "Hosts", list: hosts },
              { label: "Guests", list: guests },
            ].map((group) => (
              <div key={group.label}>
                <p className={styles.groupLabel}>{group.label}</p>
                {group.list.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={user.id === current?.id}
                    className={styles.userOption}
                    onClick={() => choose(user)}
                  >
                    <Avatar name={user.name} size={24} />
                    <span>{user.name}</span>
                    {user.is_superhost && <span className={styles.soon}>Superhost</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
