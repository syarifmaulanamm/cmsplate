import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

const stamp = Date.now();
const label = `Sales E2E ${stamp}`;

test("nomor WhatsApp baru tampil di tombol publik", async ({ page }) => {
  await page.goto(`${ADMIN}/whatsapp/new`);
  await page.locator("#label").fill(label);
  await page.locator("#agentName").fill("Rina");
  await page.locator("#phone").fill("081234567890");
  await page.locator("#defaultMessage").fill("Halo, saya ingin bertanya.");
  await page.getByRole("button", { name: "Tambah nomor" }).click();

  await page.waitForURL(`**${ADMIN}/whatsapp`);
  await expect(page.getByRole("link", { name: label })).toBeVisible();

  await page.goto("/id");
  const trigger = page.getByRole("link", { name: /Hubungi via WhatsApp/ });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("href", /wa\.me\/6281234567890/);

  // Bersihkan agar test lain tidak melihat tombol tambahan.
  await page.goto(`${ADMIN}/whatsapp`);
  const row = page.locator("tr").filter({ hasText: label }).first();
  await row.getByRole("button", { name: /Lihat/ }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hapus nomor" }).click();
  await page.waitForURL(`**${ADMIN}/whatsapp`);

  await expect(page.getByRole("link", { name: label })).toHaveCount(0);
});

test("nomor tidak valid ditolak", async ({ page }) => {
  await page.goto(`${ADMIN}/whatsapp/new`);
  await page.locator("#label").fill("Invalid");
  await page.locator("#agentName").fill("Test");
  await page.locator("#phone").fill("123");
  await page.getByRole("button", { name: "Tambah nomor" }).click();

  await expect(page.getByText("Nomor tidak valid.")).toBeVisible();
});
