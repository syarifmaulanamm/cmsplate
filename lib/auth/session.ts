import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { Role } from "@prisma/client";

/**
 * Sesi disimpan di database (lihat docs/PRD.md). Token mentah hanya ada di cookie;
 * yang tersimpan di DB adalah SHA-256 dari token sehingga bocornya DB tidak
 * langsung memberi akses.
 */
export const SESSION_COOKIE = "cmsplate_session";

const SESSION_TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`${ip}:${env.AUTH_SECRET}`).digest("hex").slice(0, 32);
}

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipHash: meta?.ip ? hashIp(meta.ip) : null,
      userAgent: meta?.userAgent?.slice(0, 255) ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, locale: true, isActive: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    locale: session.user.locale,
  };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

/** Untuk test: perbandingan hash tanpa bocor waktu. */
export function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
