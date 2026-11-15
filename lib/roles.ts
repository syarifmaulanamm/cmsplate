import type { Role } from "@prisma/client";

/**
 * Logika peran murni tanpa dependensi server, agar bisa dipakai juga di
 * komponen klien (menu, command palette) tanpa menarik modul server-only.
 */
export const ROLE_RANK: Record<Role, number> = {
  AUTHOR: 1,
  EDITOR: 2,
  SUPER_ADMIN: 3,
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

export function hasRole(role: Role, minimum: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManageUsers(role: Role) {
  return role === "SUPER_ADMIN";
}

export function canPublish(role: Role) {
  return hasRole(role, "EDITOR");
}

export function canEditPost(role: Role, authorId: string, userId: string) {
  if (role === "AUTHOR") return authorId === userId;
  return true;
}
