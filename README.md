# Playwright 測試執行指南

## 基本執行命令

### 執行所有測試

```bash
npx playwright test
```

### 執行特定專案的測試

**執行會員測試（需要登入）：**

```bash
npx playwright test --project=member
```

**執行訪客測試（不需要登入）：**

```bash
npx playwright test --project=guest
```

**執行設定專案（登入設定）：**

```bash
npx playwright test --project=setup
```

### 執行特定測試檔案

**執行特定測試檔案：**

```bash
# 執行特定測試檔案
npx playwright test renter/member/某個測試檔案.spec.ts

# 執行訪客測試檔案
npx playwright test renter/guest/某個測試檔案.spec.ts
```

## 同時執行 Member 和 Guest 測試

### 方法 1：執行多個專案（推薦）

```bash
npx playwright test --project=member --project=guest
```

### 方法 2：執行所有測試（包含 setup, member, guest）

```bash
npx playwright test
```

### 方法 3：分別執行並查看結果

```bash
# 先執行 member 測試
npx playwright test --project=member

# 再執行 guest 測試
npx playwright test --project=guest
```

## NPM 簡化指令

### 基本測試指令

```bash
# 執行所有測試
npm test

# 執行所有測試（顯示瀏覽器）
npm run test:head

# 執行會員測試
npm run test:member

# 執行訪客測試
npm run test:guest

# 同時執行會員和訪客測試
npm run test:both

# 執行設定專案
npm run test:setup
```

### 帶時間戳的測試報告

**執行測試並生成時間戳報告：**

```bash
# 執行所有測試並生成時間戳報告
npm run test:report

# 執行會員測試並生成時間戳報告
npm run test:report:member

# 執行訪客測試並生成時間戳報告
npm run test:report:guest

# 執行會員+訪客測試並生成時間戳報告
npm run test:report:both
```

### 查看測試報告

```bash
# 查看最新報告
npm run show-latest

# 查看標準報告
npm run show-report
```

### 報告管理

```bash
# 清理舊報告（預設保留5個）
npm run clean-reports

# 自訂保留數量（例如保留10個）
npm run clean-reports 10
```

## 其他實用選項

**以 headed 模式執行（顯示瀏覽器）：**

```bash
npx playwright test --headed
```

**執行測試並產生 HTML 報告：**

```bash
npx playwright test --reporter=html
```

**顯示測試報告：**

```bash
npx playwright show-report
```

**同時執行多個專案並產生報告：**

```bash
npx playwright test --project=member --project=guest --reporter=html
```

## 專案結構

- 測試檔案位於 `renter/` 目錄中
- `member/` - 需要登入的測試
- `guest/` - 不需要登入的測試
- 系統會自動執行 setup 專案來準備登入狀態（當執行 member 測試時）

## 專案配置說明

根據 `playwright.config.ts` 的設定：

- **testDir**: `renter/` - 測試檔案目錄
- **baseURL**: `https://www-dev.loopmaas.com` - 測試目標網站
- **authFile**: `playwright/.auth/user.json` - 儲存登入狀態的檔案

### 專案類型

1. **setup 專案**

   - 負責處理登入流程
   - 測試檔案：`member/auth.setup.ts`
   - 為 member 專案提供驗證狀態

2. **member 專案**

   - 需要登入的測試
   - 依賴 setup 專案
   - 測試檔案：`member/*.spec.ts`
   - 使用儲存的登入狀態

3. **guest 專案**
   - 不需要登入的測試
   - 測試檔案：`guest/*.spec.ts`
   - 獨立執行，無需驗證狀態

## 測試報告功能特色

### 時間戳報告系統

1. **自動時間戳命名**：報告格式為 `playwright-report_2025-08-16_22-33-12`
2. **自動清理**：每次執行測試後自動清理舊報告，預設保留 10 個
3. **最新連結**：自動創建 `test-reports/latest` 符號連結指向最新報告
4. **報告歷史**：所有報告保存在 `test-reports/` 目錄下
5. **定時執行友善**：適合 CI/CD 和定時任務使用

### 報告目錄結構

```
test-reports/
├── latest -> playwright-report_2025-08-16_22-33-12
├── playwright-report_2025-08-16_22-33-12/
├── playwright-report_2025-08-16_22-30-45/
└── playwright-report_2025-08-16_22-25-30/
```

### 適用場景

- **開發階段**：使用基本測試指令快速執行和除錯
- **CI/CD 集成**：使用時間戳報告指令保存測試歷史
- **定時測試**：適合自動化排程，工程師可查看歷史報告
- **報告管理**：定期清理舊報告，維持系統整潔
