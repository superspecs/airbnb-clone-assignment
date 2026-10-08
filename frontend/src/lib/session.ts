import { cookies } from "next/headers";

// Mock authentication: the selected demo user's id lives in a cookie and is forwarded to the
// API as X-Demo-User-Id. No passwords or real sessions exist in this demo.
export const DEMO_USER_COOKIE = "stays_demo_user";
/** Seeded guest "Priya Nair" — used until a visitor picks someone else. */
export const DEFAULT_DEMO_USER_ID = 6;

/** Server-only: the demo user the current request acts as. */
export async function getCurrentUserId(): Promise<number> {
  const raw = (await cookies()).get(DEMO_USER_COOKIE)?.value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : DEFAULT_DEMO_USER_ID;
}
