import { getDemoUsers } from "@/lib/api/account";
import { getCurrentUserId } from "@/lib/session";

import { UserMenuButton } from "./UserMenuButton";

/** Server part: resolves the current demo user, then renders the interactive menu. */
export async function UserMenu() {
  const [currentId, users] = await Promise.all([
    getCurrentUserId(),
    getDemoUsers().catch(() => []),
  ]);
  const current = users.find((u) => u.id === currentId) ?? null;
  return <UserMenuButton current={current} users={users} />;
}
