"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ScanSearchIcon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { runSeoAuditAction } from "@/lib/seo/actions";
import { Button } from "@/components/ui/button";

export function RunAuditButton({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = dict.admin.seo.monitor;

  function run() {
    startTransition(async () => {
      await runSeoAuditAction();
      toast.success(t.toast.ran);
      router.refresh();
    });
  }

  return (
    <Button onClick={run} disabled={pending}>
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          {t.running}
        </>
      ) : (
        <>
          <ScanSearchIcon className="size-4" aria-hidden />
          {t.run}
        </>
      )}
    </Button>
  );
}
