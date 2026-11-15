import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const title = `E2E OG ${stamp}`;
const slug = `e2e-og-${stamp}`;
const ogTitle = `Judul OpenGraph ${stamp}`;

test("OG title dan schema tampil di halaman publik", async ({ page }) => {
  await page.goto(`${ADMIN}/posts/new`);
  await page.locator("#title_id").fill(title);

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await editor.fill("Konten untuk menguji OpenGraph dan schema JSON-LD.");

  await page.locator('select[name="categoryId"]').selectOption({ label: "Panduan" });
  await page.locator("#status_id").selectOption("PUBLISHED");

  await page.locator("#ogTitle").fill(ogTitle);
  await page.locator("#ogDescription").fill("Deskripsi khusus untuk kartu sosial.");

  await page.getByRole("button", { name: "FAQ", exact: true }).click();
  await expect(page.getByLabel("Schema JSON-LD")).toContainText("FAQPage");

  await page.getByRole("button", { name: "Simpan draf" }).click();
  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/posts/[a-z0-9]{20,}/edit$`));

  await page.goto(`/id/blog/${slug}`);

  const ogMeta = page.locator('meta[property="og:title"]');
  await expect(ogMeta).toHaveAttribute("content", ogTitle);

  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.join(" ")).toContain("FAQPage");
  expect(schemas.join(" ")).toContain(title);
});

test("schema tidak valid ditolak dengan pesan jelas", async ({ page }) => {
  await page.goto(`${ADMIN}/posts/new`);
  await page.locator("#title_id").fill(`E2E Schema Invalid ${stamp}`);

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await editor.fill("Konten singkat.");

  await page.locator('select[name="categoryId"]').selectOption({ label: "Panduan" });
  await page.getByLabel("Schema JSON-LD").fill("{");
  await page.getByRole("button", { name: "Simpan draf" }).click();

  await expect(
    page.getByText("JSON tidak valid. Periksa tanda kutip dan koma.").first(),
  ).toBeVisible();
});
