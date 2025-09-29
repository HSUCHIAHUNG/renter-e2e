import { test, expect } from "@playwright/test";

test("車輛列表頁-驗證前五筆價格是否由小到大排序", async ({ page }) => {
  // 1. 導航到頁面
  await page.goto(process.env.BASE_URL || "https://www-dev.loopmaas.com/");

  // 2. 前往搜尋頁面 (車輛列表)
  // 這是模擬使用者行為，很重要
  await page.getByRole("button", { name: "搜尋" }).click();

  // 3. 等待頁面加載完成，並確保價格元素可見
  // 直接等待價格元素，而非 wrapper
  await page.waitForSelector('[data-testid="search_carList_originPrice"]');

  // 4. 直接取得所有價格元素的 Locator
  const priceElements = page.getByTestId("search_carList_originPrice");

  // 5. 取得所有 Locator，並取出前五個
  const firstFivePriceLocators = (await priceElements.all()).slice(0, 5);

  // 6. 宣告一個陣列來儲存處理後的價格
  const prices: number[] = [];

  // 7. 遍歷前五個 Locator，取得並處理價格
  for (const priceLocator of firstFivePriceLocators) {
    const priceText = await priceLocator.textContent();
    // 處理價格文本，移除逗號並轉換為數字
    if (priceText) {
      const numericPrice = parseInt(priceText.replace(/,/g, ""), 10);

      // 檢查是否為有效數字
      if (!isNaN(numericPrice)) {
        prices.push(numericPrice);
      } else {
        throw new Error(`無法將價格 "${priceText}" 轉換為數字`);
      }
    }
  }

  // 8. 驗證價格陣列的長度是否為 5
  expect(prices).toHaveLength(5);

  // 9. 驗證價格是否由小到大排序
  const sortedPrices = [...prices].sort((a, b) => a - b);
  expect(prices).toEqual(sortedPrices);
});
