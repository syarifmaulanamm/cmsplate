import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession, type SessionUser } from "@/lib/auth/session";
import { canManageUsers, canPublish, hasRole, ROLE_RANK } from "@/lib/roles";

export { canManageUsers, canPublish, hasRole, ROLE_RANK };

import { adminLoginPath, adminPath } from "@/lib/admin-path";

/** Dipakai di Server Action: melempar error agar mutasi tidak pernah berjalan tanpa izin. */
export async function requireUser() {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireRole(minimum: Role) {
  const user = await requireUser();
  if (!hasRole(user.role, minimum)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Dipakai di layout/halaman: redirect ke login dengan parameter tujuan. */
export async function requirePageUser(minimum: Role = "AUTHOR", next = adminPath()) {
  const user = await getSession();
  if (!user) {
    redirect(adminLoginPath(next));
  }
  if (!hasRole(user.role, minimum)) {
    redirect(adminPath("?denied=1"));
  }
  return user;
}

export type { SessionUser };
