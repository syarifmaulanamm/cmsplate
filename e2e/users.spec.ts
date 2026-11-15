import { expect, test } from "@playwright/test";
import { ADMIN, escapeRegExp } from "./paths";

const stamp = Date.now();
const name = `E2E Editor ${stamp}`;
const email = `e2e-${stamp}@simplecms.local`;

test("membuat, mengubah, dan menghapus pengguna", async ({ page }) => {
  await page.goto(`${ADMIN}/users/new`);
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Password123");
  await page.locator("#role").selectOption("EDITOR");
  await page.getByRole("button", { name: "Buat pengguna" }).click();

  await page.waitForURL(`**${ADMIN}/users`);
  await expect(page.getByRole("link", { name })).toBeVisible();

  await page.getByRole("link", { name }).click();
  await page.getByRole("link", { name: "Edit pengguna" }).click();

  const updated = `${name} Revisi`;
  await page.locator("#name").fill(updated);
  await page.getByRole("button", { name: "Simpan pengguna" }).click();

  await page.waitForURL(new RegExp(`${escapeRegExp(ADMIN)}/users/[a-z0-9]{20,}$`));
  await expect(page.getByRole("heading", { name: updated })).toBeVisible();

  await page.getByRole("button", { name: "Hapus" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hapus pengguna" }).click();

  await page.waitForURL(`**${ADMIN}/users`);
  await expect(page.getByRole("link", { name: updated })).toHaveCount(0);
});

test("email duplikat ditolak", async ({ page }) => {
  await page.goto(`${ADMIN}/users/new`);
  await page.locator("#name").fill("Duplikat");
  await page.locator("#email").fill("admin@simplecms.local");
  await page.locator("#password").fill("Password123");
  await page.getByRole("button", { name: "Buat pengguna" }).click();

  await expect(page.getByText("Email sudah dipakai.")).toBeVisible();
});
