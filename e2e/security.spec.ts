import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("header keamanan terkirim", async ({ request }) => {
  const response = await request.get("/id");
  expect(response.status()).toBe(200);

  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("upload tanpa sesi ditolak", async ({ request }) => {
  const response = await request.post("/api/media/upload", {
    multipart: {
      files: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") },
    },
  });
  expect(response.status()).toBe(401);
});

test("path traversal pada media ditolak", async ({ request }) => {
  const response = await request.get("/api/media/..%2f..%2fetc%2fpasswd");
  expect([400, 404]).toContain(response.status());
});

test("cron menolak tanpa secret", async ({ request }) => {
  expect((await request.get("/api/cron/analytics")).status()).toBe(401);
  expect((await request.get("/api/cron/seo")).status()).toBe(401);
});
