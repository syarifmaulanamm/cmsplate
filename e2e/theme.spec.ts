import { expect, test } from "@playwright/test";
import { ADMIN } from "./paths";

test("tema berfungsi tanpa peringatan script tag", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/id");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const before = (await page.locator("html").getAttribute("class")) ?? "";
  await page.getByRole("button", { name: /Aktifkan tema/ }).click();

  await expect
    .poll(async () => (await page.locator("html").getAttribute("class")) ?? "")
    .not.toBe(before);

  await page.goto(`${ADMIN}`);
  await expect(page.getByRole("heading", { name: /Sari|Selamat/ }).first()).toBeVisible();

  const scriptWarnings = errors.filter((message) =>
    message.includes("Encountered a script tag"),
  );
  expect(scriptWarnings).toHaveLength(0);
});
