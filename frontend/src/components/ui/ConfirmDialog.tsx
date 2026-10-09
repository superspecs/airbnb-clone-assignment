"use client";

import type { ReactNode, RefObject } from "react";

import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  /** The parent opens it with `dialogRef.current?.showModal()`. */
  dialogRef: RefObject<HTMLDialogElement | null>;
  id: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Safe choice; focused when the dialog opens. */
  dismissLabel: string;
  /** Destructive choice; omit to show only the dismiss button (e.g. when the action is blocked). */
  confirmLabel?: string;
  onConfirm?: () => void;
}

/** Modal confirmation for destructive actions (cancel a reservation, delete a listing). */
export function ConfirmDialog({ dialogRef, id, title, subtitle, children, dismissLabel, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children && <div className={styles.body}>{children}</div>}
      <div className={styles.actions}>
        <button type="button" className={styles.dismiss} onClick={close} autoFocus>
          {dismissLabel}
        </button>
        {confirmLabel && onConfirm && (
          <button
            type="button"
            className={styles.confirm}
            onClick={() => {
              close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        )}
      </div>
    </dialog>
  );
}
