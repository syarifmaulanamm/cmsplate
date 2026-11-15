import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { scoreLabel, type SeoCheck } from "@/lib/seo/score";
import { cn } from "@/lib/utils";

const labelTone: Record<ReturnType<typeof scoreLabel>, string> = {
  poor: "bg-destructive",
  fair: "bg-warning",
  good: "bg-primary",
  great: "bg-success",
};

export function SeoMeter({
  dict,
  score,
  checks,
  compact = false,
}: {
  dict: Dictionary;
  score: number;
  checks: SeoCheck[];
  compact?: boolean;
}) {
  const t = dict.admin.seo;
  const label = scoreLabel(score);

  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{t.score}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", labelTone[label])}
          style={{ width: `${Math.max(4, score)}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.score}
        />
      </div>

      <p className="text-xs font-medium">{t.labels[label]}</p>

      {!compact ? (
        <ul className="grid gap-1.5">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-xs">
              {check.ok ? (
                <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              ) : (
                <CircleIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
              )}
              <span className={check.ok ? "text-muted-foreground" : "text-foreground"}>
                {t.checks[check.id]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
