import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { getWhatsappNumber } from "@/lib/whatsapp/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { WhatsappNumberForm } from "@/components/admin/whatsapp/number-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.whatsapp.detail.editAction,
    robots: { index: false, follow: false },
  };
}

export default async function EditWhatsappPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/whatsapp"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);

  const { id } = await params;
  const number = await getWhatsappNumber(id);
  if (!number) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath(`/whatsapp/${number.id}`)}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.admin.whatsapp.detail.backToIndex}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{number.label}</h1>
      </header>

      <WhatsappNumberForm
        dict={dict}
        mode="edit"
        defaults={{
          id: number.id,
          label: number.label,
          phone: number.phone,
          agentName: number.agentName,
          defaultMessage: number.defaultMessage,
          avatarId: number.avatarId,
          avatarUrl: number.avatarUrl,
          weight: number.weight,
          position: number.position,
          isActive: number.isActive,
          schedule: number.schedule,
        }}
      />
    </div>
  );
}
