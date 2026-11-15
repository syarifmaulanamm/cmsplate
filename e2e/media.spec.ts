import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

const fileName = `e2e-${Date.now()}.png`;

test("mengunggah media lalu mengisi alt text", async ({ page }) => {
  await page.goto(`${ADMIN}/media`);

  await page.locator('input[type="file"]').first().setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: Buffer.from(PNG_BASE64, "base64"),
  });

  await expect(page.getByText(fileName)).toBeVisible({ timeout: 15_000 });

  const card = page.locator("li").filter({ hasText: fileName }).first();
  await card.getByRole("button", { name: "Aksi" }).click();
  await page.getByRole("menuitem", { name: "Detail media" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="alt"]').fill("Gambar uji coba");
  await dialog.getByRole("button", { name: "Simpan detail" }).click();

  await expect(page.getByText("Detail media disimpan.")).toBeVisible();
});

test("media picker punya dua tab", async ({ page }) => {
  await page.goto(`${ADMIN}/media`);
  await page.getByRole("button", { name: "Pilih media" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: "Pilih media" })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: "Unggah" })).toBeVisible();

  await dialog.getByRole("tab", { name: "Unggah" }).click();
  await expect(dialog.getByText("Tarik file ke sini, atau pilih dari komputer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("menghapus media lewat dialog konfirmasi", async ({ page }) => {
  await page.goto(`${ADMIN}/media`);

  const card = page.locator("li").filter({ hasText: fileName }).first();
  await card.getByRole("button", { name: "Aksi" }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hapus media" }).click();

  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(page.locator("li").filter({ hasText: fileName })).toHaveCount(0, { timeout: 15_000 });
});
