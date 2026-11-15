import "server-only";
import { db } from "@/lib/db";

type RawCount = { views: bigint | number; visitors: bigint | number };

export type AnalyticsRange = 7 | 30 | 90;

export type AnalyticsOverview = {
  days: AnalyticsRange;
  views: number;
  visitors: number;
  daily: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  referrers: { source: string; views: number }[];
  devices: { device: string; views: number }[];
};

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  return value ?? 0;
}

export async function getAnalyticsOverview(days: AnalyticsRange): Promise<AnalyticsOverview> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [overviewRows, dailyRows, pageRows, referrerRows, deviceRows] = await Promise.all([
    db.$queryRaw<RawCount[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors
      FROM analytics_pageviews
      WHERE "createdAt" >= ${since}
    `,
    db.$queryRaw<{ day: Date; views: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
      FROM analytics_pageviews
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    db.$queryRaw<{ path: string; views: bigint }[]>`
      SELECT path, COUNT(*) AS views
      FROM analytics_pageviews
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 10
    `,
    db.$queryRaw<{ source: string | null; views: bigint }[]>`
      SELECT referrer AS source, COUNT(*) AS views
      FROM analytics_pageviews
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 8
    `,
    db.$queryRaw<{ device: string; views: bigint }[]>`
      SELECT "deviceType" AS device, COUNT(*) AS views
      FROM analytics_pageviews
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY views DESC
    `,
  ]);

  const overview = overviewRows[0];

  return {
    days,
    views: toNumber(overview?.views),
    visitors: toNumber(overview?.visitors),
    daily: dailyRows.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      views: toNumber(row.views),
    })),
    topPages: pageRows.map((row) => ({ path: row.path, views: toNumber(row.views) })),
    referrers: referrerRows.map((row) => ({
      source: row.source ?? "direct",
      views: toNumber(row.views),
    })),
    devices: deviceRows.map((row) => ({ device: row.device, views: toNumber(row.views) })),
  };
}

/** Mengisi tabel agregat harian. Dijalankan oleh cron. */
export async function aggregateDaily(days = 3) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return db.$executeRaw`
    INSERT INTO analytics_daily (id, date, path, views, visitors)
    SELECT md5(random()::text || clock_timestamp()::text), date_trunc('day', "createdAt")::date, path,
           COUNT(*)::int, COUNT(DISTINCT "visitorHash")::int
    FROM analytics_pageviews
    WHERE "createdAt" >= ${since}
    GROUP BY 2, 3
    ON CONFLICT (date, path) DO UPDATE
      SET views = EXCLUDED.views, visitors = EXCLUDED.visitors
  `;
}

export async function pruneOldPageviews(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return db.analyticsPageview.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
