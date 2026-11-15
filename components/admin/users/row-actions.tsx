"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { deleteUser } from "@/lib/users/actions";
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

export function UserRowActions({
  id,
  name,
  dict,
  trigger = "menu",
}: {
  id: string;
  name: string;
  dict: Dictionary;
  trigger?: "menu" | "button";
}) {
  const base = useAdminBase();
  const router = useRouter();
  const t = dict.admin.users;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.ok) {
        toast.success(t.toast.deleted);
        setOpen(false);
        router.push(`${base}/users`);
        router.refresh();
        return;
      }

      setBlocked(
        result.code === "SELF"
          ? t.validation.selfDisable
          : result.code === "LAST_SUPER_ADMIN"
            ? t.validation.lastSuperAdmin
            : result.code === "IN_USE"
              ? dict.common.unknownError
              : dict.common.unknownError,
      );
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
              <Link href={`${base}/users/${id}`}>
                <EyeIcon /> {t.actions.view}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/users/${id}/edit`}>
                <PencilIcon /> {t.actions.edit}
              </Link>
            </DropdownMenuItem>
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
            <AlertDialogTitle>{t.delete.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {blocked ?? formatMessage(t.delete.body, { name })}
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
                    remove();
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
