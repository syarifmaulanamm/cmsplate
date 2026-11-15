"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { runSeoAudit } from "@/lib/seo/audit";
import { ignoreSeoIssue } from "@/lib/seo/queries";
import { adminPath } from "@/lib/admin-path";

export async function runSeoAuditAction() {
  await requireRole("EDITOR");
  await runSeoAudit();
  revalidatePath(adminPath("/seo"));
  return { ok: true };
}

export async function ignoreSeoIssueAction(id: string) {
  await requireRole("EDITOR");
  await ignoreSeoIssue(id);
  revalidatePath(adminPath("/seo"));
  return { ok: true };
}
