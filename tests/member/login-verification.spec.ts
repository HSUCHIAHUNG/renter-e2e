import { test, expect } from "@playwright/test";

test("測試用戶是否已登入", async ({ page }) => {
  await page.goto(process.env.BASE_URL || "https://www-dev.loopmaas.com");
  await expect(page.getByRole("button", { name: "登出" })).toBeVisible();
});
