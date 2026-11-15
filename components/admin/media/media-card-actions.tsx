"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  FileTextIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { deleteMedia, updateMediaMetadata } from "@/lib/media/actions";
import type { AdminMedia } from "@/lib/media/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function MediaCardActions({
  media,
  dict,
  canDelete,
}: {
  media: AdminMedia;
  dict: Dictionary;
  canDelete: boolean;
}) {
  const router = useRouter();
  const t = dict.admin.media;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isImage = media.mimeType.startsWith("image/");

  function copyUrl() {
    const url = `${window.location.origin}${media.url}`;
    void navigator.clipboard.writeText(url).then(() => toast.success(dict.common.copied));
  }

  function submitMetadata(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMediaMetadata({ ok: false }, formData);
      if (result.ok) {
        toast.success(t.toast.updated);
        setEditOpen(false);
        router.refresh();
        return;
      }
      setError(result.code === "ALT_REQUIRED" ? t.altHint : dict.common.unknownError);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMedia(media.id);
      if (result.ok) {
        toast.success(t.toast.deleted);
        setDeleteOpen(false);
        router.refresh();
        return;
      }
      toast.error(dict.common.unknownError);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={dict.common.actions}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => {
              setError(null);
              setEditOpen(true);
            }}
          >
            <PencilIcon /> {t.editTitle}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={copyUrl}>
            <CopyIcon /> {t.copyUrl}
          </DropdownMenuItem>
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2Icon /> {dict.common.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editTitle}</DialogTitle>
            <DialogDescription>{t.editDescription}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitMetadata(new FormData(event.currentTarget));
            }}
            className="mt-4 grid gap-4"
          >
            <input type="hidden" name="id" value={media.id} />

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="grid size-10 place-items-center rounded bg-secondary text-muted-foreground">
                <FileTextIcon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{media.filename}</p>
                <p className="text-xs text-muted-foreground">{media.mimeType}</p>
              </div>
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <div className="grid gap-2">
              <Label htmlFor={`alt-${media.id}`}>
                {t.alt}
                {isImage ? <span className="text-muted-foreground">({dict.common.required})</span> : null}
              </Label>
              <Input id={`alt-${media.id}`} name="alt" defaultValue={media.alt} />
              <p className="text-xs text-muted-foreground">{t.altHint}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`caption-${media.id}`}>
                {t.caption}
                <span className="text-muted-foreground">({dict.common.optional})</span>
              </Label>
              <Textarea
                id={`caption-${media.id}`}
                name="caption"
                defaultValue={media.caption}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                {dict.common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    {dict.common.saving}
                  </>
                ) : (
                  t.saveMetadata
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {media.usage > 0
                ? formatMessage(t.deleteUsedBody, { count: media.usage })
                : formatMessage(t.deleteBody, { name: media.filename })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {t.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
