import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

test("collector menerima page view dan dashboard menampilkannya", async ({ page, request }) => {
  const response = await request.post("/api/analytics/collect", {
    data: { path: "/id/blog", referrer: "https://google.com/" },
    headers: { "user-agent": "Mozilla/5.0 (Macintosh) E2E-Analytics/1.0" },
  });
  expect(response.status()).toBe(204);

  await expect
    .poll(
      async () => {
        await page.goto(`${ADMIN}/analytics?range=7`);
        return page.locator("section p.text-2xl").first().innerText();
      },
      { timeout: 20_000 },
    )
    .not.toBe("0");

  await expect(page.getByText("Tren kunjungan")).toBeVisible();
  await expect(page.getByText("google.com")).toBeVisible();
});

test("bot tidak dicatat sebagai kunjungan", async ({ request }) => {
  const before = await request.post("/api/analytics/collect", {
    data: { path: "/id/bot-test" },
    headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" },
  });
  expect(before.status()).toBe(204);

  const badRequest = await request.post("/api/analytics/collect", {
    data: {},
    headers: { "user-agent": "Mozilla/5.0 E2E" },
  });
  expect(badRequest.status()).toBe(400);
});
