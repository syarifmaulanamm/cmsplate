import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

const customName = `E2E Site ${Date.now()}`;

test("nama situs tersimpan dan tampil di publik", async ({ page }) => {
  await page.goto(`${ADMIN}/settings`);
  await page.locator("#siteName").fill(customName);
  await page.locator("#tagline").fill("Tagline dari pengaturan");
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();

  await expect(page.getByText("Pengaturan disimpan.")).toBeVisible();

  await page.goto("/id");
  await expect(page.getByText(customName).first()).toBeVisible();
  await expect(page.getByText("Tagline dari pengaturan")).toBeVisible();

  // Kembalikan agar test lain memakai nama default.
  await page.goto(`${ADMIN}/settings`);
  await page.locator("#siteName").fill("CMSPlate");
  await page.locator("#tagline").fill("");
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByText("Pengaturan disimpan.")).toBeVisible();
});
