import "server-only";
import { db } from "@/lib/db";
import { countWords } from "@/lib/content/text";

export type AuditSeverity = "CRITICAL" | "WARNING" | "INFO";

type AuditIssue = {
  postId: string | null;
  rule: string;
  severity: AuditSeverity;
  message: string;
};

const WEIGHT: Record<AuditSeverity, number> = { CRITICAL: 15, WARNING: 5, INFO: 1 };

export async function runSeoAudit() {
  const translations = await db.postTranslation.findMany({
    where: { status: "PUBLISHED", post: { deletedAt: null } },
    include: {
      post: {
        include: {
          featuredImage: { select: { id: true, alt: true } },
          translations: { where: { status: "PUBLISHED" }, select: { locale: true } },
        },
      },
    },
  });

  const ignored = await db.seoIssue.findMany({
    where: { ignoredAt: { not: null }, postId: { not: null } },
    select: { rule: true, postId: true },
  });
  const ignoredKeys = new Set(ignored.map((issue) => `${issue.postId}:${issue.rule}`));

  const issues: AuditIssue[] = [];
  const titleGroups = new Map<string, string[]>();
  const descriptionGroups = new Map<string, string[]>();

  for (const translation of translations) {
    const postId = translation.postId;
    const push = (rule: string, severity: AuditSeverity, message: string) => {
      if (ignoredKeys.has(`${postId}:${rule}`)) return;
      issues.push({ postId, rule, severity, message });
    };

    const title = translation.title.trim();
    if (title.length < 30 || title.length > 60) {
      push("titleLength", "WARNING", `${title.length} karakter (disarankan 30–60)`);
    }

    const description = (translation.metaDescription || translation.excerpt).trim();
    if (description.length < 70) {
      push("metaDescription", "WARNING", `${description.length} karakter (disarankan 70–160)`);
    } else if (description.length > 160) {
      push("metaDescription", "WARNING", `${description.length} karakter (maksimal 160)`);
    }

    const words = countWords(translation.contentText);
    if (words < 300) {
      push("contentLength", "INFO", `${words} kata (disarankan ≥300)`);
    }

    if (translation.slug.length > 75) {
      push("slugLength", "INFO", `${translation.slug.length} karakter (maksimal 75)`);
    }

    if (!translation.post.featuredImage) {
      push("featuredImage", "INFO", "Belum ada gambar utama");
    } else if (!translation.post.featuredImage.alt?.trim()) {
      push("imageAlt", "CRITICAL", "Gambar utama belum punya alt text");
    }

    if (title) {
      const key = `${translation.locale}:${title.toLowerCase()}`;
      titleGroups.set(key, [...(titleGroups.get(key) ?? []), postId]);
    }
    if (description) {
      const key = `${translation.locale}:${description.toLowerCase()}`;
      descriptionGroups.set(key, [...(descriptionGroups.get(key) ?? []), postId]);
    }
  }

  for (const group of titleGroups.values()) {
    if (group.length < 2) continue;
    for (const postId of group) {
      if (!ignoredKeys.has(`${postId}:duplicateTitle`)) {
        issues.push({
          postId,
          rule: "duplicateTitle",
          severity: "WARNING",
          message: `${group.length} artikel memakai judul yang sama`,
        });
      }
    }
  }

  for (const group of descriptionGroups.values()) {
    if (group.length < 2) continue;
    for (const postId of group) {
      if (!ignoredKeys.has(`${postId}:duplicateDescription`)) {
        issues.push({
          postId,
          rule: "duplicateDescription",
          severity: "WARNING",
          message: `${group.length} artikel memakai deskripsi yang sama`,
        });
      }
    }
  }

  const penalty = issues.reduce((total, issue) => total + WEIGHT[issue.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  const audit = await db.seoAudit.create({
    data: { url: "/", entityType: "site", entityId: "site", score },
  });

  if (issues.length > 0) {
    await db.seoIssue.createMany({
      data: issues.map((issue) => ({
        auditId: audit.id,
        postId: issue.postId,
        rule: issue.rule,
        severity: issue.severity,
        message: issue.message,
      })),
    });
  }

  return { auditId: audit.id, score, issueCount: issues.length };
}
