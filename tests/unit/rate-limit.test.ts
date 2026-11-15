import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimit());

  it("mengizinkan lima percobaan lalu memblokir", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(rateLimit("login:1.2.3.4", 5, 60_000).ok).toBe(true);
    }

    const blocked = rateLimit("login:1.2.3.4", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("memisahkan bucket antar key", () => {
    rateLimit("login:a", 1, 60_000);
    expect(rateLimit("login:a", 1, 60_000).ok).toBe(false);
    expect(rateLimit("login:b", 1, 60_000).ok).toBe(true);
  });

  it("mengizinkan lagi setelah jendela waktu lewat", () => {
    rateLimit("login:c", 1, 10);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(rateLimit("login:c", 1, 10).ok).toBe(true);
        resolve();
      }, 20);
    });
  });
});
