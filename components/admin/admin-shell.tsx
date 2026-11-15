"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ExternalLinkIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { NAV_GROUPS, navItemsForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/admin/command-menu";
import { UserMenu } from "@/components/admin/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAdminBase } from "@/components/admin-path-context";

export function AdminShell({
  user,
  locale,
  dict,
  children,
}: {
  user: SessionUser;
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const base = useAdminBase();
  const items = navItemsForRole(user.role);
  const t = dict.admin.shell;
  const labels = dict.admin.nav;

  const current =
    items
      .filter((item) => item.path !== "" && pathname.startsWith(`${base}${item.path}`))
      .sort((a, b) => b.path.length - a.path.length)[0] ?? items[0];

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t.skipToContent}
      </a>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-20 bg-foreground/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        aria-label="Navigasi utama"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-border bg-card",
          "transition-transform duration-200 ease-out-soft lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[76px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2 px-4",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <Link href={base} className="flex items-center gap-2.5" aria-label={t.brand}>
            <Image
              src="/brand/cmsplate-icon.png"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0"
              priority
            />
            <span className={cn("text-sm font-semibold tracking-tight", collapsed && "lg:hidden")}>
              {t.brand}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label={t.closeMenu}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;

            return (
              <div key={group} className="mb-4">
                <p
                  className={cn(
                    "px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                    collapsed && "lg:hidden",
                  )}
                >
                  {labels.groups[group]}
                </p>
                <ul className="grid gap-0.5">
                  {groupItems.map((item) => {
                    const href = `${base}${item.path}`;
                    const isActive =
                      item.path === "" ? pathname === base : pathname.startsWith(href);

                    const content = (
                      <>
                        <item.icon className="size-4 shrink-0" aria-hidden />
                        <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>
                          {labels[item.key]}
                        </span>
                      </>
                    );

                    return (
                      <li key={item.key}>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setMobileOpen(false)}
                          title={collapsed ? labels[item.key] : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-foreground/80",
                            collapsed && "lg:justify-center lg:px-0",
                          )}
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="grid gap-1 border-t border-border p-2">
          <Link
            href={`/${locale}`}
            target="_blank"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              collapsed && "lg:justify-center lg:px-0",
            )}
            title={t.viewSite}
          >
            <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && "lg:hidden")}>{t.viewSite}</span>
          </Link>
          <UserMenu user={user} dict={dict} locale={locale} collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={cn(
              "hidden cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="size-4" aria-hidden />
            ) : (
              <PanelLeftCloseIcon className="size-4" aria-hidden />
            )}
            <span className={cn(collapsed && "hidden")}>{t.collapse}</span>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding-left] duration-200 ease-out-soft",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]",
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label={t.openMenu}
          >
            <MenuIcon className="size-5" />
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-sm">
              <li className="hidden text-muted-foreground sm:block">
                <Link href={base} className="transition-colors hover:text-foreground">
                  {t.adminCrumb}
                </Link>
              </li>
              {current && current.path !== "" ? (
                <>
                  <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                    /
                  </li>
                  <li className="truncate font-medium">{labels[current.key]}</li>
                </>
              ) : (
                <li className="font-medium">{t.dashboardCrumb}</li>
              )}
            </ol>
          </nav>

          <CommandMenu role={user.role} dict={dict} />

          <Button asChild variant="soft" size="sm" className="hidden sm:inline-flex">
            <Link href={`${base}/posts/new`}>
              <PlusIcon className="size-4" />
              {dict.admin.dashboard.recent.write}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm" className="sm:hidden">
            <Link href={`${base}/posts/new`} aria-label={dict.admin.dashboard.recent.write}>
              <PlusIcon className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
