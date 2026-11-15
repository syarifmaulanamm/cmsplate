"use client";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction, setLocaleAction } from "@/lib/auth/actions";
import { avatarTone, cn, initials } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/roles";
import { otherLocale, localeMeta, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminBase } from "@/components/admin-path-context";

export function UserMenu({
  user,
  dict,
  locale,
  collapsed,
}: {
  user: SessionUser;
  dict: Dictionary;
  locale: Locale;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const base = useAdminBase();
  const { setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const t = dict.admin.shell;

  const nextLocale = otherLocale(locale);

  function switchLanguage() {
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-accent",
            collapsed && "justify-center p-1.5",
          )}
          aria-label={t.userMenu}
        >
          <Avatar className="size-8">
            <AvatarFallback className={cn("text-[11px]", avatarTone(user.name))}>
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {ROLE_LABEL[user.role]}
              </span>
            </span>
          ) : null}
          {!collapsed ? (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="normal-case">
          <span className="block text-[13px] font-medium text-foreground">{user.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase">{t.theme}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <SunIcon /> {t.themeLight}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <MoonIcon /> {t.themeDark}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <MonitorIcon /> {t.themeSystem}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={switchLanguage}>
          <span aria-hidden>文</span>
          {t.language}: <span className="ml-auto font-medium">{localeMeta[nextLocale].short}</span>
        </DropdownMenuItem>
        {user.role === "SUPER_ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href={`${base}/settings`}>
              <SettingsIcon /> {t.accountSettings}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logoutAction();
            router.refresh();
          }}
        >
          <LogOutIcon /> {t.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LogoutButton({ label }: { label: string }) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
        <LogOutIcon className="size-4" aria-hidden />
        {label}
      </Button>
    </form>
  );
}
