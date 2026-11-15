"use client";

import { createContext, useContext } from "react";

const AdminPathContext = createContext("admin");

/** Membagikan segmen path admin (tanpa slash) ke komponen klien. */
export function AdminPathProvider({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <AdminPathContext.Provider value={value}>{children}</AdminPathContext.Provider>;
}

/** Basis path admin di klien, mis. `/panel-rahasia`. */
export function useAdminBase() {
  return `/${useContext(AdminPathContext)}`;
}

/** Gabungkan basis admin dengan suffix, mis. `adminHref(base, "/posts")`. */
export function adminHref(base: string, suffix = "") {
  if (!suffix) return base;
  return suffix.startsWith("/") || suffix.startsWith("?") ? `${base}${suffix}` : `${base}/${suffix}`;
}
