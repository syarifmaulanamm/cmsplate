import "server-only";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function listUsers() {
  const rows = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { posts: true, media: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt,
    postCount: row._count.posts,
    mediaCount: row._count.media,
  }));
}

export async function getUser(id: string) {
  const row = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      locale: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { posts: true, media: true, sessions: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    locale: row.locale,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    postCount: row._count.posts,
    mediaCount: row._count.media,
    sessionCount: row._count.sessions,
  };
}

export async function countSuperAdmins(excludeId?: string) {
  return db.user.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export const ROLES: Role[] = ["SUPER_ADMIN", "EDITOR", "AUTHOR"];
