"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CornerDownLeftIcon, SearchIcon } from "lucide-react";
import type { Role } from "@prisma/client";
import { navItemsForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminBase } from "@/components/admin-path-context";

export function CommandMenu({ role, dict }: { role: Role; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const base = useAdminBase();
  const t = dict.admin.shell;
  const labels = dict.admin.nav;

  const items = useMemo(() => {
    const all = navItemsForRole(role).map((item) => ({
      ...item,
      href: `${base}${item.path}`,
    }));
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((item) => labels[item.key].toLowerCase().includes(needle));
  }, [role, base, query, labels]);

  const activeIndex = Math.min(cursor, Math.max(items.length - 1, 0));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setCursor(0);
    }
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-elevated-sm transition-colors duration-150 hover:bg-accent"
      >
        <SearchIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">{t.search}</span>
        <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-[15%] p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">{t.search}</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setCursor((index) => Math.min(index + 1, items.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setCursor((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter") {
                  const item = items[activeIndex];
                  if (item) go(item.href);
                }
              }}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t.searchEmpty}</p>
            ) : (
              <ul role="listbox" aria-label={t.searchResults}>
                {items.map((item, index) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => go(item.href)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-100",
                        index === activeIndex ? "bg-accent text-accent-foreground" : "text-foreground",
                      )}
                    >
                      <item.icon className="size-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1">{labels[item.key]}</span>
                      {index === activeIndex ? (
                        <CornerDownLeftIcon className="size-3.5 text-muted-foreground" aria-hidden />
                      ) : (
                        <ArrowRightIcon className="size-3.5 opacity-0" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>{t.searchHintOpen}</span>
            <span>{t.searchHintClose}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
