"use client";

import { useTheme } from "@/lib/theme";

/** Menerapkan kelas tema ke <html> tanpa menyuntikkan <script> dari sisi klien. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}
