import { describe, expect, it } from "vitest";
import {
  deviceFromUserAgent,
  isBot,
  normalizeReferrer,
  visitorHash,
} from "@/lib/analytics/hash";
import { integrationPatterns } from "@/lib/integrations/shared";

describe("analytics helpers", () => {
  it("membuat hash pengunjung yang stabil dalam hari yang sama", () => {
    const date = new Date("2026-05-01T10:00:00Z");
    const a = visitorHash("1.2.3.4", "Mozilla/5.0", date);
    const b = visitorHash("1.2.3.4", "Mozilla/5.0", date);
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("mengganti hash pada hari berikutnya", () => {
    const day1 = visitorHash("1.2.3.4", "Mozilla/5.0", new Date("2026-05-01T10:00:00Z"));
    const day2 = visitorHash("1.2.3.4", "Mozilla/5.0", new Date("2026-05-02T10:00:00Z"));
    expect(day1).not.toBe(day2);
  });

  it("mendeteksi bot umum", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (Macintosh) Chrome/120")).toBe(false);
  });

  it("mengenali perangkat dari user agent", () => {
    expect(deviceFromUserAgent("iPhone Safari")).toBe("mobile");
    expect(deviceFromUserAgent("iPad Safari")).toBe("tablet");
    expect(deviceFromUserAgent("Macintosh Chrome")).toBe("desktop");
  });

  it("menormalkan referrer dan mengabaikan domain sendiri", () => {
    expect(normalizeReferrer("https://google.com/search?q=1", "localhost:3000")).toBe("google.com");
    expect(normalizeReferrer("http://localhost:3000/id", "localhost:3000")).toBeNull();
    expect(normalizeReferrer("bukan url", "localhost:3000")).toBeNull();
  });
});

describe("format ID integrasi", () => {
  it("menerima format resmi", () => {
    expect(integrationPatterns.gtm.test("GTM-ABC1234")).toBe(true);
    expect(integrationPatterns.ga4.test("G-ABC1234567")).toBe(true);
    expect(integrationPatterns.ads.test("AW-123456789")).toBe(true);
  });

  it("menolak format yang salah", () => {
    expect(integrationPatterns.gtm.test("GTM-")).toBe(false);
    expect(integrationPatterns.ga4.test("UA-12345")).toBe(false);
    expect(integrationPatterns.ads.test("AW_123")).toBe(false);
  });
});
