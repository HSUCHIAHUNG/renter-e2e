import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";
import "dotenv/config";

// 1. 取得目前檔案的路徑和目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定義儲存驗證狀態的檔案路徑
const authFile = "auth/user.json";

// 為測試結果創建時間戳記目錄
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
export default defineConfig({
  testDir: path.join(__dirname, "tests"),
  fullyParallel: true,

  // 在 CI/CD 環境中，若有 test.only 的提交，則直接讓測試失敗，防止意外跳過其他測試。
  // 在本地開發時則允許使用 test.only 方便除錯。
  forbidOnly: !!process.env.CI,

  // 在 CI/CD 環境中，測試失敗時會重試 2 次，增加測試的穩定性，避免因網路等暫時性問題導致失敗。
  // 在本地開發時則不重試，以便快速發現問題。
  retries: process.env.CI ? 2 : 0,

  // 在 CI/CD 環境中，限制並行數量為 1，確保測試循序執行，結果最穩定。
  // 在本地開發時，Playwright 會根據 CPU 核心數自動決定並行數量，以求最快速度。
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: process.env.PLAYWRIGHT_HTML_REPORT || "reports/latest",
      },
    ],
  ],

  /* --- 專案設定 --- */
  projects: [
    // 專案 1: 設定專案 - 僅用於登入
    {
      name: "setup",
      testMatch: /member\/auth.setup.ts/,
      outputDir: `assets/setup/${timestamp}`,
    },
    // 專案 2: 已登入專案 - 用於需要登入的測試
    {
      name: "member",
      use: {
        ...devices["Desktop Chrome"],
        // 使用由 'setup' 專案產生的驗證狀態
        storageState: authFile,
        baseURL: process.env.BASE_URL || "https://www-dev.loopmaas.com",
        video: {
          mode: "retain-on-failure",
          size: { width: 1280, height: 720 },
        },
        screenshot: {
          mode: "only-on-failure",
          fullPage: true,
        },
      },
      // 這個專案依賴 'setup' 專案，必須先執行 setup
      dependencies: ["setup"],
      // 您可以指定這個專案要執行的測試檔案目錄
      testMatch: /member\/.*\.spec\.ts/,
      outputDir: `assets/member-tests/${timestamp}`,
    },

    // 專案 3: 公開專案 - 用於不需要登入的測試
    {
      name: "guest",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.BASE_URL || "https://www-dev.loopmaas.com",
        video: {
          mode: "retain-on-failure",
          size: { width: 1280, height: 720 },
        },
        screenshot: {
          mode: "only-on-failure",
          fullPage: true,
        },
      },
      // 您可以指定這個專案要執行的測試檔案目錄
      testMatch: /guest\/.*\.spec\.ts/,
      outputDir: `assets/guest-tests/${timestamp}`,
    },

    /* 您也可以為 Firefox, WebKit 等瀏覽器設定類似的專案 */
    // {
    //   name: 'Logged In Firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: authFile, baseURL: 'https://www-dev.loopmaas.com' },
    //   dependencies: ['setup'],
    //   testMatch: /tests\/member-area\/.*\.spec\.js/,
    // },
  ],

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
