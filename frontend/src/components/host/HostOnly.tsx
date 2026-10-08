"use client";

import { useTransition } from "react";

import { switchDemoUser } from "@/app/actions";
import { Avatar } from "@/components/layout/Avatar";
import { toast } from "@/components/ui/Toast";
import type { DemoUser } from "@/lib/types/user";

import styles from "./Host.module.css";

/** Shown to guests on host pages: pick a demo host to continue (mock sign-in). */
export function HostOnly({ hosts }: { hosts: DemoUser[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className={styles.gate}>
      <h2 className={styles.gateTitle}>Switch to a host account</h2>
      <p className={styles.muted}>
        Hosting tools are only available to hosts. Choose a demo host to manage their listings.
      </p>
      <div className={styles.hostChoices}>
        {hosts.map((host) => (
          <button
            key={host.id}
            type="button"
            className={styles.hostChoice}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await switchDemoUser(host.id);
                toast(`Now browsing as ${host.name} (host).`, "info");
              })
            }
          >
            <Avatar name={host.name} size={32} />
            <span>{host.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
