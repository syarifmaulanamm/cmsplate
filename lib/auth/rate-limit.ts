/**
 * Rate limit in-memory sederhana dengan sliding window.
 * Cocok untuk satu instance (deployment Docker v1). Jika aplikasi di-scale
 * horizontal, ganti implementasinya dengan Redis atau tabel di Postgres.
 */
type Bucket = { hits: number[]; };

const store = new Map<string, Bucket>();
const MAX_ENTRIES = 5_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key) ?? { hits: [] };
  const fresh = bucket.hits.filter((timestamp) => now - timestamp < windowMs);

  if (fresh.length >= limit) {
    const oldest = fresh[0] ?? now;
    store.set(key, { hits: fresh });
    return { ok: false, remaining: 0, retryAfterMs: windowMs - (now - oldest) };
  }

  fresh.push(now);
  store.set(key, { hits: fresh });

  if (store.size > MAX_ENTRIES) {
    for (const [entryKey, entry] of store) {
      if (entry.hits.every((timestamp) => now - timestamp >= windowMs)) {
        store.delete(entryKey);
      }
    }
  }

  return { ok: true, remaining: limit - fresh.length, retryAfterMs: 0 };
}

/** Hanya untuk test. */
export function resetRateLimit() {
  store.clear();
}
