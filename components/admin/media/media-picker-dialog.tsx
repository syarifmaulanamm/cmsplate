"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckIcon, FileTextIcon, ImageIcon, Loader2Icon, SearchIcon, UploadIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PickerItem = {
  id: string;
  filename: string;
  url: string;
  fullUrl: string;
  mimeType: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  dict,
  accept = "all",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: PickerItem) => void;
  dict: Dictionary;
  accept?: "image" | "all";
}) {
  const t = dict.admin.media.picker;
  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<PickerItem[] | null>(null);
  const [selected, setSelected] = useState<PickerItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced, type: accept === "image" ? "image" : "all" });

    fetch(`/api/media/list?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { items?: PickerItem[] }) => {
        if (!active) return;
        setItems(data.items ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, debounced, accept, reloadKey]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setDebounced("");
      setSelected(null);
      setTab("browse");
      setError(null);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);

    setUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = (await response.json()) as {
        uploaded?: Array<{ id: string; url: string; filename: string }>;
        errors?: Array<{ code: string }>;
      };

      const first = data.uploaded?.[0];
      if (first) {
        const item: PickerItem = {
          id: first.id,
          filename: first.filename,
          url: first.url,
          fullUrl: first.url,
          mimeType: accept === "image" ? "image/*" : "application/octet-stream",
          alt: "",
          width: null,
          height: null,
        };
        setSelected(item);
        setReloadKey((key) => key + 1);
        setTab("browse");
      }

      if (data.errors && data.errors.length > 0) {
        setError(dict.admin.media.toast.wrongType);
      }
    } catch {
      setError(dict.common.unknownError);
    } finally {
      setUploading(false);
    }
  }

  const needsAlt = Boolean(selected && selected.mimeType.startsWith("image") && !selected.alt);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[8%] max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="browse">
              <ImageIcon className="size-3.5" aria-hidden />
              {t.tabBrowse}
            </TabsTrigger>
            <TabsTrigger value="upload">
              <UploadIcon className="size-3.5" aria-hidden />
              {t.tabUpload}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="relative mb-4">
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
            </div>

            <div className="max-h-[46vh] overflow-y-auto rounded-lg border border-border p-3">
              {items === null ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="aspect-square animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {items.map((item) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          aria-pressed={isSelected}
                          className={cn(
                            "group relative block w-full cursor-pointer overflow-hidden rounded-lg border bg-muted text-left transition-colors duration-150",
                            isSelected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <span className="relative block aspect-square">
                            {item.mimeType.startsWith("image/") ? (
                              <Image
                                src={item.url}
                                alt={item.alt || item.filename}
                                fill
                                unoptimized
                                sizes="160px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="grid h-full w-full place-items-center text-muted-foreground">
                                <FileTextIcon className="size-6" aria-hidden />
                              </span>
                            )}
                          </span>
                          <span className="block truncate bg-card px-2 py-1.5 text-[11px]">
                            {item.filename}
                          </span>
                          {isSelected ? (
                            <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                              <CheckIcon className="size-3" aria-hidden />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/50 px-6 py-14 text-center transition-colors hover:border-primary/40"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void upload(event.dataTransfer.files);
              }}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-muted-foreground">
                {uploading ? (
                  <Loader2Icon className="size-5 animate-spin" aria-hidden />
                ) : (
                  <UploadIcon className="size-5" aria-hidden />
                )}
              </span>
              <span className="text-sm font-medium">{dict.admin.media.dropzone}</span>
              <span className="text-xs text-muted-foreground">
                {dict.admin.media.dropzoneHint.replace("{size}", "10")}
              </span>
              <input
                type="file"
                className="sr-only"
                accept="image/*,application/pdf"
                onChange={(event) => void upload(event.target.files)}
              />
            </label>
          </TabsContent>
        </Tabs>

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
        {needsAlt ? <p className="mt-3 text-xs text-warning">{t.altRequired}</p> : null}

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {selected ? selected.filename : "\u00a0"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={!selected || needsAlt}
              onClick={() => {
                if (!selected) return;
                onSelect(selected);
                handleOpenChange(false);
              }}
            >
              {t.choose}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
