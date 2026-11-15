import type { Dictionary } from "@/lib/i18n";

export function SiteFooter({ dict, tagline }: { dict: Dictionary; tagline?: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{tagline || dict.public.footer.tagline}</p>
        <p>{dict.public.footer.builtWith}</p>
      </div>
    </footer>
  );
}
