"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { deleteCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
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
import { useAdminBase } from "@/components/admin-path-context";

export function CategoryRowActions({
  id,
  name,
  dict,
  canEdit,
  trigger = "menu",
}: {
  id: string;
  name: string;
  dict: Dictionary;
  canEdit: boolean;
  trigger?: "menu" | "button";
}) {
  const base = useAdminBase();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<{ posts: number; children: number } | null>(null);
  const t = dict.admin.categories;

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.ok) {
        toast.success(t.toast.deleted);
        setOpen(false);
        router.push(`${base}/categories`);
        router.refresh();
        return;
      }

      if (result.code === "IN_USE") {
        setBlocked({ posts: result.posts ?? 0, children: result.children ?? 0 });
        return;
      }

      toast.error(t.toast.blocked);
      setOpen(false);
    });
  }

  return (
    <>
      {trigger === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`${t.actions.view} ${name}`}>
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`${base}/categories/${id}`}>
                <EyeIcon /> {t.actions.view}
              </Link>
            </DropdownMenuItem>
            {canEdit ? (
              <DropdownMenuItem asChild>
                <Link href={`${base}/categories/${id}/edit`}>
                  <PencilIcon /> {t.actions.edit}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canEdit ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setBlocked(null);
                    setOpen(true);
                  }}
                >
                  <Trash2Icon /> {t.actions.delete}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setBlocked(null);
            setOpen(true);
          }}
        >
          <Trash2Icon className="size-4" aria-hidden />
          {t.actions.delete}
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{blocked ? t.delete.blockedTitle : t.delete.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {blocked
                ? formatMessage(t.delete.blockedBody, {
                    posts: blocked.posts,
                    children: blocked.children,
                  })
                : formatMessage(t.delete.body, { name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {blocked ? (
              <AlertDialogCancel>{dict.common.close}</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>{t.delete.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={(event) => {
                    event.preventDefault();
                    confirmDelete();
                  }}
                >
                  {t.delete.confirm}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
