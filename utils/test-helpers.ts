import { Page, expect } from '@playwright/test';

/**
 * 通用的等待函數
 */
export class WaitHelpers {
  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async waitForElement(page: Page, selector: string, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
  }
}

/**
 * 數據驗證工具
 */
export class ValidationHelpers {
  static validatePriceArray(prices: number[], expectedLength?: number) {
    if (expectedLength) {
      expect(prices).toHaveLength(expectedLength);
    }
    
    prices.forEach(price => {
      expect(price).toBeGreaterThan(0);
      expect(typeof price).toBe('number');
    });
  }

  static isSortedAscending(array: number[]): boolean {
    for (let i = 1; i < array.length; i++) {
      if (array[i] < array[i - 1]) {
        return false;
      }
    }
    return true;
  }
}

/**
 * 截圖工具
 */
export class ScreenshotHelpers {
  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }
}