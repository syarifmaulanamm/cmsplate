import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const title = `E2E Sampah ${stamp}`;

test("artikel yang dihapus bisa dipulihkan dari Sampah", async ({ page }) => {
  await page.goto(`${ADMIN}/posts/new`);
  await page.locator("#title_id").fill(title);

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await editor.fill("Draf singkat untuk menguji alur Sampah dan pemulihan.");

  await page.locator('select[name="categoryId"]').selectOption({ label: "Panduan" });
  await page.getByRole("button", { name: "Simpan draf" }).click();
  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/posts/[a-z0-9]{20,}/edit$`));

  await page.goto(`${ADMIN}/posts?q=${encodeURIComponent(title)}`);
  const row = page.locator("tr").filter({ hasText: title }).first();
  await row.getByRole("button", { name: /Lihat/ }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hapus artikel" }).click();
  await page.waitForURL(`**${ADMIN}/posts`);

  await page.goto(`${ADMIN}/posts/trash`);
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("button", { name: "Pulihkan" }).first().click();
  await expect(page.getByText("Artikel dipulihkan.")).toBeVisible();

  await page.goto(`${ADMIN}/posts?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
