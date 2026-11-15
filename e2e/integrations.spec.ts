import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

test("menyimpan integrasi GTM lalu muncul di halaman publik", async ({ page, request }) => {
  await page.goto(`${ADMIN}/integrations`);

  await page.locator("#gtm").fill("GTM-E2E1234");
  await page.locator('input[name="gtm_enabled"]').check();
  await page.getByRole("button", { name: "Simpan integrasi" }).click();
  await expect(page.getByText("Integrasi disimpan.")).toBeVisible();

  const html = await (await request.get("/id")).text();
  expect(html).toContain("GTM-E2E1234");
  expect(html).toContain("gtag('consent', 'default'");

  await page.goto("/id");
  const banner = page.getByRole("dialog", { name: "Kami memakai cookie analytics" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Izinkan" }).click();
  await expect(banner).toBeHidden();

  // Bersihkan agar test lain tidak memuat script eksternal.
  await page.goto(`${ADMIN}/integrations`);
  await page.locator("#gtm").fill("");
  await page.locator('input[name="gtm_enabled"]').uncheck();
  await page.getByRole("button", { name: "Simpan integrasi" }).click();
  await expect(page.getByText("Integrasi disimpan.")).toBeVisible();
});

test("format ID yang salah ditolak", async ({ page }) => {
  await page.goto(`${ADMIN}/integrations`);
  await page.locator("#ga4").fill("UA-12345");
  await page.getByRole("button", { name: "Simpan integrasi" }).click();
  await expect(page.getByText("Format ID tidak dikenali.").first()).toBeVisible();
});
