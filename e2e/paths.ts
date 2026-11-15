/** Path admin mengikuti ADMIN_PATH pada server yang sedang diuji. */
export const ADMIN_PATH = process.env.ADMIN_PATH?.trim() || "admin";
export const ADMIN = `/${ADMIN_PATH}`;
export const LOGIN = ADMIN_PATH === "admin" ? "/login" : `${ADMIN}/login`;

/** Escape teks untuk dipakai di dalam RegExp. */
export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
