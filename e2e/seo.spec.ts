import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const title = `E2E Audit Artikel ${stamp}`;

test("menjalankan audit SEO dan mengabaikan satu isu", async ({ page }) => {
  // Artikel baru tanpa gambar dan konten pendek agar pasti memunculkan isu.
  await page.goto(`${ADMIN}/posts/new`);
  await page.locator("#title_id").fill(title);
  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await editor.fill("Pendek.");
  await page.locator('select[name="categoryId"]').selectOption({ label: "Panduan" });
  await page.locator("#status_id").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Simpan draf" }).click();
  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/posts/[a-z0-9]{20,}/edit$`));

  await page.goto(`${ADMIN}/seo`);
  await page.getByRole("button", { name: "Jalankan audit" }).first().click();
  await expect(page.getByText("Audit selesai.")).toBeVisible();
  await page.reload();

  const score = page.locator("section p.text-2xl").first();
  await expect(score).not.toHaveText("—");

  const rows = page.locator("tbody tr");
  const before = await rows.count();
  expect(before).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Abaikan" }).first().click();
  await expect(page.getByText("Isu diabaikan.")).toBeVisible();
  await expect(rows).toHaveCount(before - 1);
});

test("filter tingkat isu bekerja", async ({ page }) => {
  await page.goto(`${ADMIN}/seo?severity=INFO`);
  await expect(page.getByText("Info").first()).toBeVisible();
});

test("cron SEO menolak tanpa secret", async ({ request }) => {
  const response = await request.get("/api/cron/seo");
  expect(response.status()).toBe(401);
});
