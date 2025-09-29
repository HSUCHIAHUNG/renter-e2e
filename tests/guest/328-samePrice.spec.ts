import { test, expect } from "@playwright/test";

test("車輛列表頁-驗證價格是否相同", async ({ page }) => {
  // 1. 導航到頁面
  await page.goto(process.env.BASE_URL || "https://www-dev.loopmaas.com/");

  // 2. 前往搜尋頁面 (車輛列表)
  await page.getByRole("button", { name: "搜尋" }).click();

  // 3. 等待頁面加載完成，並確保價格元素可見
  // 直接等待價格元素，而非 wrapper
  await page.waitForSelector('[data-testid="search_carList_originPrice"]');

  // 4. 取得搜尋結果頁車輛價格
  const carDetail_originPriceText = await page
    .getByTestId("search_carList_originPrice")
    .first()
    .textContent();

  if (carDetail_originPriceText) {
    // 處理價格文本，移除逗號並轉換為數字
    const carDetail_numericOriginPrice = parseInt(
      carDetail_originPriceText.replace(/,/g, ""),
      10
    );

    // 檢查是否為有效數字, 如果不是, 則抛出錯誤
    if (isNaN(carDetail_numericOriginPrice)) {
      throw new Error(
        `無法將價格 "${carDetail_numericOriginPrice}" 轉換為數字`
      );
    }

    // 5. 使用 Promise.all() 來同時處理點擊和等待新視窗
    //    注意：page.waitForEvent('popup') 會返回一個代表新視窗的 page 物件
    const [newPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByTestId("search_carList_wrapper").first().click(),
    ]);

    // 6. 確保新頁面已經被開啟
    expect(newPage).not.toBeNull();

    // 7. 檢查新頁面的 URL 是否正確
    await expect(newPage).toHaveURL(/cars/);

    // 8. 等待頁面加載完成，並確保價格元素可見
    // 直接等待價格元素，而非 wrapper
    await newPage.waitForSelector('[data-testid="carDetail_originalPrice"]');

    // 9. 取得詳細頁車輛價格
    const carDetail_originalPriceText = await newPage
      .getByTestId("carDetail_originalPrice")
      .textContent();

    if (carDetail_originalPriceText) {
      // 處理價格文本，移除逗號並轉換為數字
      const carDetail_numericOriginalPrice = parseInt(
        carDetail_originalPriceText.replace(/,/g, ""),
        10
      );

      // 檢查是否為有效數字, 如果不是, 等待2秒後重新獲取
      if (isNaN(carDetail_numericOriginalPrice)) {
        // 等待2秒
        await newPage.waitForTimeout(2000);

        // 重新獲取價格文本
        const retryCarDetail_originalPriceText = await newPage
          .getByTestId("carDetail_originalPrice")
          .textContent();

        if (retryCarDetail_originalPriceText) {
          // 重新處理價格文本
          const retryCarDetail_numericOriginalPrice = parseInt(
            retryCarDetail_originalPriceText.replace(/,/g, ""),
            10
          );

          // 如果重新獲取後仍不是數字，檢查是否為 "--元"
          if (isNaN(retryCarDetail_numericOriginalPrice)) {
            if (retryCarDetail_originalPriceText.trim() === "--元") {
              // 如果是 "--元" 則跳過價格比較，直接結束測試
              return;
            } else {
              throw new Error(
                `無法將價格 "${retryCarDetail_originalPriceText}" 轉換為數字`
              );
            }
          }

          // 使用重新獲取的價格進行比較
          expect(carDetail_numericOriginPrice).toBe(
            retryCarDetail_numericOriginalPrice
          );
          return;
        }
      }

      // 10. 檢查價格是否相同
      expect(carDetail_numericOriginPrice).toBe(carDetail_numericOriginalPrice);
    }
  }
});
