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
      window.localStorage.setItem(key, value);
      window.localStorage.setItem("auth_token", token);
      window.localStorage.setItem("auth_token_expiry", expiry);
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
      domain: "www-dev.loopmaas.com",
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
  await page.goto("https://www-dev.loopmaas.com");
  await programmaticLogin(page);

  // 重新載入頁面，讓應用程式使用注入的 token 初始化
  await page.reload();

  // 等待一個明確的登入後才有的元素出現，確保頁面已穩定
  await expect(page.getByRole("button", { name: "登出" })).toBeVisible();

  // 在所有事情都穩定後，才儲存驗證狀態
  await page.context().storageState({ path: authFile });
});
