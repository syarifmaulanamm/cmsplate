import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Jangan sebutkan path admin kustom di robots.txt: itu justru membocorkan lokasinya.
  const disallow = env.ADMIN_PATH === "admin" ? ["/admin", "/login", "/api/"] : ["/api/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
