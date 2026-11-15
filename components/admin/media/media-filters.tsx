"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function MediaFilters({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = dict.admin.media;

  const currentQuery = searchParams.get("q") ?? "";
  const currentType = searchParams.get("type") ?? "all";
  const [query, setQuery] = useState(currentQuery);

  function push(next: { q?: string; type?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const q = next.q ?? "";
    const type = next.type ?? "all";

    if (q) params.set("q", q);
    else params.delete("q");

    if (type && type !== "all") params.set("type", type);
    else params.delete("type");

    params.delete("page");

    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (query === currentQuery) return;
    const timer = setTimeout(() => push({ q: query, type: currentType }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentQuery]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="pl-9"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              push({ q: "", type: currentType });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label={dict.common.reset}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="sm:w-48">
        <NativeSelect
          value={currentType}
          onChange={(event) => push({ q: currentQuery, type: event.target.value })}
          aria-label={t.type}
        >
          <option value="all">{t.allTypes}</option>
          <option value="image">{t.images}</option>
          <option value="document">{t.documents}</option>
        </NativeSelect>
      </div>
    </div>
  );
}
