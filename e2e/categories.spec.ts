import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const nameId = `E2E Kategori ${stamp}`;
const nameEn = `E2E Category ${stamp}`;
const slugId = `e2e-kategori-${stamp}`;
const slugEn = `e2e-category-${stamp}`;

test.describe.configure({ mode: "serial" });

test("membuat kategori dua bahasa", async ({ page }) => {
  await page.goto(`${ADMIN}/categories/new`);

  await page.locator("#name_id").fill(nameId);
  await expect(page.locator("#slug_id")).toHaveValue(slugId);

  await page.getByRole("tab", { name: "English" }).click();
  await page.locator("#name_en").fill(nameEn);
  await expect(page.locator("#slug_en")).toHaveValue(slugEn);

  await page.getByRole("button", { name: "Buat kategori" }).click();

  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/categories/(?!new$)[a-z0-9]{20,}$`));
  await expect(page.getByRole("heading", { name: nameId })).toBeVisible();
  await expect(page.getByText(`/${slugEn}`)).toBeVisible();
});

test("mencari kategori lewat filter", async ({ page }) => {
  await page.goto(`${ADMIN}/categories?q=${encodeURIComponent(`E2E Kategori ${stamp}`)}`);
  await expect(page.getByRole("link", { name: nameId })).toBeVisible();
});

test("mengubah kategori", async ({ page }) => {
  await page.goto(`${ADMIN}/categories?q=${encodeURIComponent(nameId)}`);
  await page.getByRole("link", { name: nameId }).click();
  await page.getByRole("link", { name: "Edit kategori" }).click();

  const updated = `${nameId} revisi`;
  await page.locator("#name_id").fill(updated);
  await page.getByRole("button", { name: "Simpan kategori" }).click();

  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/categories/(?!new$)[a-z0-9]{20,}$`));
  await expect(page.getByRole("heading", { name: updated })).toBeVisible();
});

test("menghapus kategori lewat dialog konfirmasi", async ({ page }) => {
  await page.goto(`${ADMIN}/categories?q=${encodeURIComponent(`E2E Kategori ${stamp}`)}`);
  await page.getByRole("link", { name: `${nameId} revisi` }).click();
  await expect(page.getByRole("heading", { name: `${nameId} revisi` })).toBeVisible();

  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hapus kategori" }).click();

  await page.waitForURL(`**${ADMIN}/categories`);
  await page.goto(`${ADMIN}/categories?q=${encodeURIComponent(`E2E Kategori ${stamp}`)}`);
  await expect(page.getByText("Tidak ada kategori yang cocok.")).toBeVisible();
});
