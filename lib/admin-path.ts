import "server-only";
import { env } from "@/lib/env";

/** Basis path panel admin, mis. `/admin` atau `/panel-rahasia`. */
export const adminBase = `/${env.ADMIN_PATH}`;

/**
 * Menyusun URL area admin. `suffix` boleh berupa `/posts`, `?denied=1`, atau
 * string kosong untuk dashboard.
 */
export function adminPath(suffix = "") {
  if (!suffix) return adminBase;
  return suffix.startsWith("/") || suffix.startsWith("?")
    ? `${adminBase}${suffix}`
    : `${adminBase}/${suffix}`;
}

/** URL halaman login admin, dengan tujuan opsional setelah berhasil masuk. */
export function adminLoginPath(next?: string) {
  const path = env.ADMIN_PATH === "admin" ? "/login" : `${adminBase}/login`;
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
