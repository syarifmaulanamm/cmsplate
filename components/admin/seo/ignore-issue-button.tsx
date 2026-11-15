"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { ignoreSeoIssueAction } from "@/lib/seo/actions";
import { Button } from "@/components/ui/button";

export function IgnoreIssueButton({
  id,
  dict,
}: {
  id: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = dict.admin.seo.monitor;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await ignoreSeoIssueAction(id);
          toast.success(t.toast.ignored);
          router.refresh();
        })
      }
    >
      <EyeOffIcon className="size-3.5" aria-hidden />
      {t.ignore}
    </Button>
  );
}
