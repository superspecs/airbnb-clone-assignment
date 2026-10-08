import styles from "./Avatar.module.css";

// Deterministic, original avatar: initials on a colour picked from the name. No photos needed.
const COLORS = ["#1f6f78", "#7b4b94", "#b5523b", "#3b6ea5", "#5b7f3a", "#a1673a", "#4a4a8a", "#8a3b5c"];

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.4, background: COLORS[hash % COLORS.length] }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
