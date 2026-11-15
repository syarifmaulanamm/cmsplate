"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/auth/rate-limit";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireUser } from "@/lib/rbac";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { adminLoginPath, adminPath } from "@/lib/admin-path";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("FORMAT"),
  password: z.string().min(1, "REQUIRED"),
  next: z.string().optional(),
});

export type LoginState = {
  errorCode?: "invalid" | "rateLimited";
  retryAfterSeconds?: number;
  fieldErrors?: Record<string, string[]>;
};

function safeNextPath(value: string | undefined) {
  if (!value) return adminPath();
  // Hanya izinkan path internal agar tidak menjadi open redirect.
  if (!value.startsWith("/") || value.startsWith("//")) return adminPath();
  return value;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`login:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return {
      errorCode: "rateLimited",
      retryAfterSeconds: Math.max(1, Math.ceil(limit.retryAfterMs / 1000)),
    };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Selalu jalankan perbandingan agar waktu respons tidak membocorkan
  // apakah email terdaftar atau tidak.
  const dummyHash = "$2b$12$0000000000000000000000000000000000000000000000000000";
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? dummyHash);

  if (!user || !valid || !user.isActive) {
    return { errorCode: "invalid" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id, {
    ip,
    userAgent: headerList.get("user-agent") ?? undefined,
  });

  const store = await cookies();
  store.set(LOCALE_COOKIE, isLocale(user.locale) ? user.locale : "id", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(safeNextPath(parsed.data.next));
}

export async function logoutAction() {
  await destroySession();
  redirect(adminLoginPath());
}

export async function setLocaleAction(nextLocale: string) {
  const user = await requireUser();
  const locale = isLocale(nextLocale) ? nextLocale : "id";

  await db.user.update({ where: { id: user.id }, data: { locale } });

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath(adminPath());
  revalidatePath(adminLoginPath());
}
