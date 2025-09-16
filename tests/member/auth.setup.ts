import "dotenv/config";
import { test as setup, expect, request } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

// 定義權杖的介面，方便型別檢查
interface AuthTokens {
  accessToken: string;
  refresh_token: string;
  idToken: string;
  expiresIn: number;
}

/**
 * @description 使用 ROPG 流程向 Auth0 請求權杖
 * @returns {Promise<AuthTokens>}
 */
async function getAuthTokens(): Promise<AuthTokens> {
  const apiRequest = await request.newContext();
  const response = await apiRequest.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      form: {
        grant_type: "password",
        username: process.env.AUTH0_USERNAME!,
        password: process.env.AUTH0_PASSWORD!,
        audience: process.env.AUTH0_AUDIENCE!,
        scope:
          "openid profile email read:customer write:customer offline_access",
        client_id: process.env.AUTH0_CLIENT_ID!,
      },
    }
  );

  const body = await response.json();
  console.log("response.ok()", response.ok());
  if (!response.ok()) {
    throw new Error(`Failed to get auth tokens: ${JSON.stringify(body)}`);
  }

  return {
    accessToken: body.access_token,
    refresh_token: body.refresh_token,
    idToken: body.id_token,
    expiresIn: body.expires_in,
  };
}

/**
 * @description 將權杖注入到瀏覽器頁面的 localStorage 中
 * @param page Playwright 的 Page 物件
 * @param tokens 從 getAuthTokens() 獲取的權杖
 */
export async function login(page: any, tokens: AuthTokens) {
  const auth0Key = `@@auth0spajs@@::${process.env.AUTH0_CLIENT_ID}::${process.env.AUTH0_AUDIENCE}::openid profile email read:customer write:customer offline_access`;

  const auth0Value = {
    body: {
      access_token: tokens.accessToken,
      audience: "https://foundational.loopmaasapi.com/",
      client_id: process.env.AUTH0_CLIENT_ID,
      expires_in: tokens.expiresIn,
      oauthTokenScope:
        "openid profile email read:customer write:customer offline_access",
      refresh_token: tokens.refresh_token,
      scope: "openid profile email read:customer write:customer offline_access",
      token_type: "Bearer",
    },
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expiresIn,
  };

  const expiresAt = new Date(new Date().getTime() + tokens.expiresIn * 1000);

  // 使用 page.evaluate 在瀏覽器上下文中執行腳本來設定 localStorage
  await page.evaluate(
    ([key, value, token, expiry]) => {
      // 清除任何現有的登出狀態
      window.localStorage.removeItem("auth0:event");

      window.localStorage.setItem(key, value);
      window.localStorage.setItem("auth_token", token);
      window.localStorage.setItem("auth_token_expiry", expiry);

      // 設定登入事件
      window.localStorage.setItem("auth0:event", "login");
    },
    [
      auth0Key,
      JSON.stringify(auth0Value),
      tokens.accessToken,
      expiresAt.toISOString(),
    ]
  );

  const url = new URL(page.url());
  const domain = url.hostname;
  await page.context().addCookies([
    {
      name: `auth0.cMXMp2bu3wKgaI1dkXnqjPcmo06pQ3UQ.is.authenticated`,
      value: "true",
      domain: domain,
      path: "/",
    },
  ]);
}
/**
 * @description 整合了獲取權杖和注入的完整登入流程
 * @param page Playwright 的 Page 物件
 */
export async function programmaticLogin(page: any) {
  const tokens = await getAuthTokens();
  await login(page, tokens);
}

setup("authenticate", async ({ page }) => {
  console.log("開始 Auth0 認證設定...");

  await page.goto(process.env.BASE_URL || "https://www-dev.loopmaas.com");
  console.log("已導航到頁面:", page.url());

  await programmaticLogin(page);
  console.log("程式化登入完成");

  // 重新載入頁面，讓應用程式使用注入的 token 初始化
  await page.reload();
  console.log("頁面重新載入完成");

  // 等待頁面載入完成
  await page.waitForLoadState("networkidle");
  console.log("網路閒置狀態達成");

  // 等待 React 應用程式初始化和處理認證狀態
  await page.waitForTimeout(3000);
  console.log("等待應用程式初始化完成");

  // 截圖用於除錯
  await page.screenshot({ path: "assets/debug-after-login.png" });

  // 檢查頁面標題
  const title = await page.title();
  console.log("頁面標題:", title);

  // 嘗試找到登出按鈕，增加等待時間
  try {
    await expect(page.getByRole("button", { name: "登出" })).toBeVisible({
      timeout: 15000,
    });
    console.log("找到登出按鈕，認證成功");
  } catch (error) {
    console.log("找不到登出按鈕，檢查頁面內容...");

    // 檢查是否有其他登入相關的元素
    const bodyText = await page.textContent("body");
    console.log("頁面部分內容:", bodyText?.substring(0, 500));

    // 檢查 localStorage
    const localStorage = await page.evaluate(() =>
      JSON.stringify(
        Object.keys(window.localStorage).reduce((acc, key) => {
          acc[key] = window.localStorage.getItem(key)?.substring(0, 100) || "";
          return acc;
        }, {} as Record<string, string>)
      )
    );
    console.log("LocalStorage keys:", localStorage);

    throw error;
  }

  // 在所有事情都穩定後，才儲存驗證狀態
  await page.context().storageState({ path: authFile });
  console.log("認證狀態已儲存到:", authFile);
});
