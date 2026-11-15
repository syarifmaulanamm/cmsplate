import "server-only";
import type { PostStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export type DashboardData = {
  published: number;
  review: number;
  averageScore: number | null;
  views7d: number;
  recent: Array<{
    postId: string;
    title: string;
    status: PostStatus;
    seoScore: number;
    updatedAt: Date;
  }>;
  seo: { score: number | null; openIssues: number; critical: number } | null;
};

export async function getDashboardData({
  locale,
  role,
  userId,
}: {
  locale: Locale;
  role: Role;
  userId: string;
}): Promise<DashboardData> {
  const authorScope = role === "AUTHOR" ? { authorId: userId } : {};
  const postScope = { deletedAt: null, ...authorScope };

  const [published, review, average, views7d, recent] = await Promise.all([
    db.postTranslation.count({
      where: { locale, status: "PUBLISHED", post: postScope },
    }),
    db.postTranslation.count({
      where: { locale, status: "IN_REVIEW", post: postScope },
    }),
    db.postTranslation.aggregate({
      _avg: { seoScore: true },
      where: { locale, status: "PUBLISHED", post: postScope },
    }),
    db.analyticsPageview.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    db.postTranslation.findMany({
      where: { locale, post: postScope },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        postId: true,
        title: true,
        status: true,
        seoScore: true,
        updatedAt: true,
      },
    }),
  ]);

  const latestAudit = await db.seoAudit.findFirst({
    orderBy: { ranAt: "desc" },
    select: { id: true, score: true },
  });

  let seo: DashboardData["seo"] = null;
  if (latestAudit) {
    const [openIssues, critical] = await Promise.all([
      db.seoIssue.count({ where: { auditId: latestAudit.id, ignoredAt: null } }),
      db.seoIssue.count({
        where: { auditId: latestAudit.id, ignoredAt: null, severity: "CRITICAL" },
      }),
    ]);
    seo = { score: latestAudit.score, openIssues, critical };
  }

  return {
    published,
    review,
    averageScore: average._avg.seoScore ?? null,
    views7d,
    recent,
    seo,
  };
}
