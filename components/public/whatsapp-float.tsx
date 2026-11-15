"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { PublicWhatsappNumber } from "@/lib/whatsapp/queries";
import { cn } from "@/lib/utils";

export function WhatsappFloat({
  numbers,
  mode,
  position,
  dict,
}: {
  numbers: PublicWhatsappNumber[];
  mode: "single" | "list";
  position: "right" | "left";
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const t = dict.public.whatsapp;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (numbers.length === 0) return null;

  function track() {
    window.dataLayer?.push({ event: "generate_lead", contact_method: "whatsapp" });
  }

  if (mode === "single" || numbers.length === 1) {
    const number = numbers[0];
    if (!number) return null;
    return (
      <a
        href={number.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={track}
        aria-label={`${t.open}: ${number.label}`}
        className={cn(
          "fixed bottom-6 z-40 grid size-14 place-items-center rounded-full bg-[var(--whatsapp)] text-white shadow-elevated-lg transition-transform duration-150 hover:scale-[1.03]",
          position === "left" ? "left-6" : "right-6",
        )}
      >
        <WhatsappGlyph className="size-7" />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 z-40 flex flex-col items-end gap-3",
        position === "left" ? "left-6 items-start" : "right-6",
      )}
    >
      {open ? (
        <div
          role="dialog"
          aria-label={t.title}
          className="w-72 rounded-xl border border-border bg-card p-4 shadow-elevated-lg"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <ul className="grid gap-1.5">
            {numbers.map((number) => (
              <li key={number.id}>
                <a
                  href={number.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={track}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent"
                >
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                    {number.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={number.avatarUrl}
                        alt={number.agentName}
                        className="size-full object-cover"
                      />
                    ) : (
                      number.agentName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{number.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {number.agentName}
                    </span>
                  </span>
                  <WhatsappGlyph className="size-4 text-[var(--whatsapp)]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t.open}
        className="grid size-14 cursor-pointer place-items-center rounded-full bg-[var(--whatsapp)] text-white shadow-elevated-lg transition-transform duration-150 hover:scale-[1.03] motion-reduce:transition-none"
      >
        {open ? <XIcon className="size-6" /> : <WhatsappGlyph className="size-7" />}
      </button>
    </div>
  );
}

function WhatsappGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84 0-2.63-1.02-5.1-2.88-6.96A9.78 9.78 0 0 0 12.04 2Zm0 17.98h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.03-.2-.31a8.13 8.13 0 0 1-1.25-4.34c0-4.51 3.68-8.18 8.2-8.18 2.19 0 4.25.85 5.8 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.52-3.68 8.18-8.2 8.18Zm4.5-6.13c-.25-.12-1.47-.72-1.7-.81-.22-.08-.39-.12-.55.13-.16.24-.63.8-.77.97-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.36-1.7-.14-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.17.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.3-.22.25-.85.84-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.46-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
