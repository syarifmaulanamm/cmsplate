import { expect, test } from "@playwright/test";
import { ADMIN, LOGIN } from "./paths";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@simplecms.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

test("sesi tersimpan membuka dashboard", async ({ page }) => {
  await page.goto(`${ADMIN}`);
  await expect(page.getByRole("heading", { name: /Sari/ })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Navigasi utama" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cari halaman…" })).toBeVisible();
});

test("command palette terbuka dengan Cmd+K", async ({ page }) => {
  await page.goto(`${ADMIN}`);
  await page.keyboard.press("Meta+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByPlaceholder("Cari halaman atau fitur…")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test.describe("tanpa sesi", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("pengunjung diarahkan ke login", async ({ page }) => {
    await page.goto(`${ADMIN}`);
    await expect(page).toHaveURL(
      (url) => url.pathname === LOGIN && url.searchParams.get("next") === ADMIN,
    );
    await expect(page.getByRole("heading", { name: "Selamat datang kembali" })).toBeVisible();
  });

  test("password salah menampilkan pesan yang jelas", async ({ page }) => {
    await page.goto(LOGIN);
    await page.locator("#email").fill("tidak-ada@simplecms.local");
    await page.locator("#password").fill("password-salah");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByText("Email atau password salah.")).toBeVisible();
  });

  test("pengguna dapat keluar dari sesi", async ({ page }) => {
    // Login dengan sesi sendiri agar storageState milik test lain tetap valid.
    await page.goto(LOGIN);
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL(`**${ADMIN}`);

    await page.getByRole("button", { name: "Menu pengguna" }).click();
    await page.getByRole("menuitem", { name: "Keluar" }).click();
    await page.waitForURL((url) => url.pathname === LOGIN);
    await expect(page.getByRole("heading", { name: "Selamat datang kembali" })).toBeVisible();
  });
});
