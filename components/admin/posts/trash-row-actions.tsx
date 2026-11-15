"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { permanentlyDeletePost, restorePost } from "@/lib/posts/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TrashRowActions({
  id,
  name,
  dict,
  canDeleteForever,
}: {
  id: string;
  name: string;
  dict: Dictionary;
  canDeleteForever: boolean;
}) {
  const router = useRouter();
  const t = dict.admin.posts.trash;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      const result = await restorePost(id);
      if (result.ok) {
        toast.success(t.restoreToast);
        router.refresh();
        return;
      }
      toast.error(dict.common.unknownError);
    });
  }

  function removeForever() {
    startTransition(async () => {
      const result = await permanentlyDeletePost(id);
      if (result.ok) {
        toast.success(t.deleteToast);
        setOpen(false);
        router.refresh();
        return;
      }
      toast.error(dict.common.unknownError);
      setOpen(false);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="soft" size="sm" onClick={restore} disabled={pending}>
        <RotateCcwIcon className="size-3.5" aria-hidden />
        {t.actions.restore}
      </Button>

      {canDeleteForever ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={pending}>
            <Trash2Icon className="size-3.5" aria-hidden />
            {t.actions.deleteForever}
          </Button>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {formatMessage(t.deleteBody, { name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={(event) => {
                    event.preventDefault();
                    removeForever();
                  }}
                >
                  {t.deleteConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
