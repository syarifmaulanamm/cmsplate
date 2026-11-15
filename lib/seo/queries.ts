import "server-only";
import { db } from "@/lib/db";

export type SeoIssueRow = {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  rule: string;
  message: string;
  postId: string | null;
  postTitle: string | null;
};

export async function getSeoOverview(locale: string) {
  const audit = await db.seoAudit.findFirst({
    orderBy: { ranAt: "desc" },
    include: {
      issues: {
        where: { ignoredAt: null },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        include: {
          post: {
            select: {
              translations: { select: { locale: true, title: true } },
            },
          },
        },
      },
    },
  });

  const published = await db.postTranslation.count({
    where: { status: "PUBLISHED", post: { deletedAt: null } },
  });

  const issues: SeoIssueRow[] =
    audit?.issues.map((issue) => {
      const translation =
        issue.post?.translations.find((item) => item.locale === locale) ??
        issue.post?.translations[0];
      return {
        id: issue.id,
        severity: issue.severity,
        rule: issue.rule,
        message: issue.message,
        postId: issue.postId,
        postTitle: translation?.title ?? null,
      };
    }) ?? [];

  return {
    audit: audit
      ? { id: audit.id, score: audit.score, ranAt: audit.ranAt, issueCount: issues.length }
      : null,
    issues,
    published,
    counts: {
      critical: issues.filter((issue) => issue.severity === "CRITICAL").length,
      warning: issues.filter((issue) => issue.severity === "WARNING").length,
      info: issues.filter((issue) => issue.severity === "INFO").length,
    },
  };
}

export async function ignoreSeoIssue(id: string) {
  await db.seoIssue.update({ where: { id }, data: { ignoredAt: new Date() } });
}
