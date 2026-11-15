"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import type { PostStatus } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryOption } from "@/lib/categories/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const statuses: Array<PostStatus | ""> = [
  "",
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

const statusKey: Record<string, "draft" | "in_review" | "scheduled" | "published" | "archived"> = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export function PostFilters({
  dict,
  categories,
}: {
  dict: Dictionary;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = dict.admin.posts;

  const currentQuery = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const [query, setQuery] = useState(currentQuery);

  function push(next: { q?: string; status?: string; category?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      q: next.q ?? "",
      status: next.status ?? "",
      category: next.category ?? "",
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");

    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (query === currentQuery) return;
    const timer = setTimeout(
      () => push({ q: query, status: currentStatus, category: currentCategory }),
      300,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentQuery]);

  const hasFilters = Boolean(currentQuery || currentStatus || currentCategory);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
              push({ q: "", status: currentStatus, category: currentCategory });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label={dict.common.reset}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <NativeSelect
          value={currentStatus}
          onChange={(event) => push({ q: currentQuery, status: event.target.value, category: currentCategory })}
          aria-label={dict.common.status}
          className="lg:w-44"
        >
          {statuses.map((status) => (
            <option key={status || "all"} value={status}>
              {status ? dict.admin.status[statusKey[status]!] : t.allStatuses}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={currentCategory}
          onChange={(event) => push({ q: currentQuery, status: currentStatus, category: event.target.value })}
          aria-label={t.columns.category}
          className="lg:w-48"
        >
          <option value="">{t.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {`${"— ".repeat(category.depth)}${category.name}`}
            </option>
          ))}
        </NativeSelect>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
            {t.resetFilters}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
