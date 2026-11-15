import type { LucideIcon } from "lucide-react";
import {
  BracesIcon,
  ChartLineIcon,
  FolderTreeIcon,
  ImageIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlugIcon,
  SearchCheckIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { ROLE_RANK } from "@/lib/roles";

export type NavKey =
  | "dashboard"
  | "posts"
  | "categories"
  | "media"
  | "analytics"
  | "seo"
  | "integrations"
  | "whatsapp"
  | "schema"
  | "users"
  | "settings";

export type NavGroup = "content" | "growth" | "system";

export type NavItem = {
  key: NavKey;
  path: string;
  icon: LucideIcon;
  group: NavGroup;
  minRole: Role;
};

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    path: "",
    icon: LayoutDashboardIcon,
    group: "content",
    minRole: "AUTHOR",
  },
  {
    key: "posts",
    path: "/posts",
    icon: NewspaperIcon,
    group: "content",
    minRole: "AUTHOR",
  },
  {
    key: "categories",
    path: "/categories",
    icon: FolderTreeIcon,
    group: "content",
    minRole: "EDITOR",
  },
  {
    key: "media",
    path: "/media",
    icon: ImageIcon,
    group: "content",
    minRole: "AUTHOR",
  },
  {
    key: "analytics",
    path: "/analytics",
    icon: ChartLineIcon,
    group: "growth",
    minRole: "EDITOR",
  },
  {
    key: "seo",
    path: "/seo",
    icon: SearchCheckIcon,
    group: "growth",
    minRole: "EDITOR",
  },
  {
    key: "integrations",
    path: "/integrations",
    icon: PlugIcon,
    group: "growth",
    minRole: "SUPER_ADMIN",
  },
  {
    key: "whatsapp",
    path: "/whatsapp",
    icon: MessageCircleIcon,
    group: "growth",
    minRole: "EDITOR",
  },
  {
    key: "schema",
    path: "/schema",
    icon: BracesIcon,
    group: "growth",
    minRole: "EDITOR",
  },
  {
    key: "users",
    path: "/users",
    icon: UsersIcon,
    group: "system",
    minRole: "SUPER_ADMIN",
  },
  {
    key: "settings",
    path: "/settings",
    icon: SettingsIcon,
    group: "system",
    minRole: "SUPER_ADMIN",
  },
];

export function navItemsForRole(role: Role) {
  return NAV_ITEMS.filter((item) => ROLE_RANK[role] >= ROLE_RANK[item.minRole]);
}

export const NAV_GROUPS: NavGroup[] = ["content", "growth", "system"];
