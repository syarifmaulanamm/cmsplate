import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminPathProvider } from "@/components/admin-path-context";
import { Toaster } from "@/components/ui/sonner";
import { getRequestLocale } from "@/lib/i18n/server";
import { localeMeta } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings/queries";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  const siteName = settings.siteName || dict.meta.siteName;

  return {
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },
    description: settings.description || dict.meta.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#17140F" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();

  const themeInitScript = `(function(){try{var k='cmsplate-theme';var v=localStorage.getItem(k);var t=v==='light'||v==='dark'?v:'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

  return (
    <html lang={localeMeta[locale].htmlLang} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} font-sans`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AdminPathProvider value={env.ADMIN_PATH}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AdminPathProvider>
      </body>
    </html>
  );
}
