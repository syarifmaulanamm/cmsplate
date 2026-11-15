import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { getUser } from "@/lib/users/queries";
import { updateUser } from "@/lib/users/actions";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { UserForm } from "@/components/admin/users/user-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.users.editPage.title,
    robots: { index: false, follow: false },
  };
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePageUser("SUPER_ADMIN", adminPath("/users"));
  const locale: Locale = isLocale(actor.locale) ? actor.locale : "id";
  const dict = getDictionary(locale);

  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath(`/users/${user.id}`)}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.admin.users.detail.backToIndex}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.users.editPage.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.admin.users.editPage.description}</p>
      </header>

      <UserForm
        dict={dict}
        mode="edit"
        action={updateUser}
        defaults={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }}
      />
    </div>
  );
}
