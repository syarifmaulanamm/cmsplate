import { expect, test } from "@playwright/test";
import { ADMIN, ADMIN_PATH } from "./paths";

const custom = ADMIN_PATH !== "admin";

test.describe("path admin kustom", () => {
  test.skip(!custom, "ADMIN_PATH masih default (admin)");

  test("path lama tidak dapat diakses", async ({ request }) => {
    expect((await request.get("/admin")).status()).toBe(404);
    expect((await request.get("/admin/posts")).status()).toBe(404);
    expect((await request.get("/login")).status()).toBe(404);
  });

  test("robots tidak membocorkan path admin", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).not.toContain(ADMIN);
    expect(body).not.toContain(`${ADMIN}/login`);
  });

  test("path kustom membuka dashboard", async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.getByRole("heading", { name: /Sari/ })).toBeVisible();
  });
});
