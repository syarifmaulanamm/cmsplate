import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const title = `E2E Artikel ${stamp}`;
const slug = `e2e-artikel-${stamp}`;

test.describe.configure({ mode: "serial" });

test("membuat artikel, menerbitkan, lalu tampil di publik", async ({ page, request }) => {
  await page.goto(`${ADMIN}/posts/new`);

  await page.locator("#title_id").fill(title);
  await expect(page.locator("#slug_id")).toHaveValue(slug);

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await editor.fill("Paragraf pertama untuk artikel uji coba. Isinya cukup jelas dan singkat.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraf kedua menambahkan konteks agar editor teruji dengan baik.");

  await page.locator('select[name="categoryId"]').selectOption({ label: "Panduan" });
  await page.locator("#status_id").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Simpan draf" }).click();

  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/posts/[a-z0-9]{20,}/edit$`));

  await page.goto(`/id/blog/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Paragraf pertama untuk artikel uji coba.")).toBeVisible();

  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`/id/blog/${slug}`);
});

test("filter artikel berdasarkan status", async ({ page }) => {
  await page.goto(`${ADMIN}/posts?status=PUBLISHED`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("menghapus artikel lewat dialog konfirmasi", async ({ page, request }) => {
  await page.goto(`${ADMIN}/posts?q=${encodeURIComponent(title)}`);

  const row = page.locator("tr").filter({ hasText: title }).first();
  await row.getByRole("button", { name: /Lihat/ }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hapus artikel" }).click();

  await page.waitForURL(`**${ADMIN}/posts`);

  const response = await request.get(`/id/blog/${slug}`);
  expect(response.status()).toBe(404);
});
