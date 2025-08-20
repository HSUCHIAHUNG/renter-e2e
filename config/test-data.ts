/**
 * 測試環境配置
 */
export const TEST_URLS = {
  DEV: 'https://www-dev.loopmaas.com',
  LOCAL: 'http://localhost:3000',
  STAGING: 'https://staging.loopmaas.com',
} as const;

/**
 * 測試數據
 */
export const TEST_DATA = {
  // 用戶相關
  USERS: {
    VALID_USER: {
      username: process.env.AUTH0_USERNAME || '',
      password: process.env.AUTH0_PASSWORD || '',
    },
  },
  
  // UI 元素選擇器
  SELECTORS: {
    LOGOUT_BUTTON: 'button[name="登出"]',
    SEARCH_BUTTON: 'button[name="搜尋"]',
    PRICE_ELEMENT: '[data-testid="search_carList_originPrice"]',
  },
  
  // 測試參數
  TIMEOUTS: {
    SHORT: 3000,
    MEDIUM: 10000,
    LONG: 30000,
  },
  
  // 預期結果
  EXPECTED: {
    MIN_PRICE_COUNT: 5,
    MAX_RETRY_COUNT: 3,
  },
} as const;

/**
 * 環境變數驗證
 */
export function validateEnvironment() {
  const requiredEnvVars = [
    'AUTH0_DOMAIN',
    'AUTH0_USERNAME', 
    'AUTH0_PASSWORD',
    'AUTH0_CLIENT_ID',
    'AUTH0_AUDIENCE',
  ];

  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`缺少環境變數: ${missing.join(', ')}`);
  }
}