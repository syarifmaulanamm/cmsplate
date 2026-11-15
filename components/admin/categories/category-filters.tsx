"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryOption } from "@/lib/categories/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function CategoryFilters({
  dict,
  parents,
}: {
  dict: Dictionary;
  parents: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = dict.admin.categories;

  const currentQuery = searchParams.get("q") ?? "";
  const currentParent = searchParams.get("parent") ?? "";
  const [query, setQuery] = useState(currentQuery);

  function pushParams(next: { q?: string; parent?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const q = next.q ?? "";
    const parent = next.parent ?? "";

    if (q) params.set("q", q);
    else params.delete("q");

    if (parent) params.set("parent", parent);
    else params.delete("parent");

    params.delete("page");

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (query === currentQuery) return;
    const timer = setTimeout(() => pushParams({ q: query, parent: currentParent }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentQuery]);

  const hasFilters = Boolean(currentQuery || currentParent);

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
              pushParams({ q: "", parent: currentParent });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label={dict.common.reset}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="sm:w-56">
        <NativeSelect
          value={currentParent}
          onChange={(event) => pushParams({ q: currentQuery, parent: event.target.value })}
          aria-label={t.filterParent}
        >
          <option value="">{t.allParents}</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {`${"— ".repeat(parent.depth)}${parent.name}`}
            </option>
          ))}
        </NativeSelect>
      </div>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
        >
          {t.resetFilters}
        </Button>
      ) : null}
    </div>
  );
}
