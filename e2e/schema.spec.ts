import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

test("schema global tersimpan dan tampil di publik", async ({ page, request }) => {
  await page.goto(`${ADMIN}/schema`);

  await page.getByRole("button", { name: "Organization" }).click();
  await page.getByRole("button", { name: "Simpan schema" }).click();
  await expect(page.getByText("Schema global disimpan.")).toBeVisible();

  const html = await (await request.get("/id")).text();
  expect(html).toContain('"@type":"Organization"');
  expect(html).toContain('"@context":"https://schema.org"');

  // Bersihkan agar halaman publik kembali tanpa schema global.
  await page.goto(`${ADMIN}/schema`);
  await page.getByRole("button", { name: "Kosongkan" }).click();
  await page.getByRole("button", { name: "Simpan schema" }).click();
  await expect(page.getByText("Schema global disimpan.")).toBeVisible();
});

test("JSON tidak valid ditolak", async ({ page }) => {
  await page.goto(`${ADMIN}/schema`);
  await page.getByLabel("JSON-LD global").fill("{");
  await page.getByRole("button", { name: "Simpan schema" }).click();

  await expect(page.getByText("JSON tidak valid. Periksa tanda kutip dan koma.").first()).toBeVisible();
});
