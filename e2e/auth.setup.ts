import { expect, test as setup } from "@playwright/test";
import { ADMIN, LOGIN } from "./paths";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@simplecms.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
const STORAGE_PATH = "test-results/.auth/admin.json";

setup("login sebagai Super Admin", async ({ page }) => {
  await page.goto(LOGIN);
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(`**${ADMIN}`);
  await expect(page.getByRole("heading", { name: /Sari/ })).toBeVisible();

  await page.context().storageState({ path: STORAGE_PATH });
});
