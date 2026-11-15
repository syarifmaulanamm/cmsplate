import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

const ADMIN_PATH_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Segmen admin dari env, dengan fallback aman bila nilainya tidak valid. */
function adminSegment() {
  const raw = process.env.ADMIN_PATH?.trim().toLowerCase();
  return raw && ADMIN_PATH_PATTERN.test(raw) ? raw : "admin";
}

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const accept = request.headers.get("accept-language");
  if (accept) {
    const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
    if (first.startsWith("en")) return "en";
  }

  return defaultLocale;
}

function localeHeaders(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  return headers;
}

function withLocaleHeader(request: NextRequest, locale: Locale) {
  return NextResponse.next({ request: { headers: localeHeaders(request, locale) } });
}

/** Rewrite ke route internal sambil tetap membawa header locale. */
function rewriteInternal(request: NextRequest, locale: Locale, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url, { request: { headers: localeHeaders(request, locale) } });
}

/** Balas 404 lewat halaman not-found agar tidak membocorkan keberadaan route. */
function hiddenNotFound(request: NextRequest) {
  return rewriteInternal(request, preferredLocale(request), "/_cmsplate_hidden");
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const admin = adminSegment();
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Path admin kustom: rewrite ke /admin secara internal.
  if (first === admin) {
    const locale = preferredLocale(request);

    if (admin === "admin") {
      return withLocaleHeader(request, locale);
    }

    const rest = segments.slice(1);

    // Login ikut berada di bawah path kustom.
    if (rest.length === 1 && rest[0] === "login") {
      return rewriteInternal(request, locale, "/login");
    }

    return rewriteInternal(request, locale, rest.length === 0 ? "/admin" : `/admin/${rest.join("/")}`);
  }

  // Route internal lama tidak boleh diakses langsung saat path diganti.
  // Pada mode default (`admin`), /login tetap dipakai sebagai halaman masuk.
  if ((first === "admin" || first === "login") && admin !== "admin") {
    return hiddenNotFound(request);
  }

  // Area non-publik lain: cukup tandai locale untuk <html lang>.
  if (pathname.startsWith("/login")) {
    return withLocaleHeader(request, preferredLocale(request));
  }

  if (isLocale(first)) {
    return withLocaleHeader(request, first);
  }

  const locale = preferredLocale(request);
  const suffix = pathname === "/" ? "" : pathname;
  const target = new URL(`/${locale}${suffix}${search}`, request.url);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!_next|api|brand|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
