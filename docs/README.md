# 🎭 Playwright 測試報告文檔

這個資料夾包含自動產生的 Playwright 測試報告，並透過 GitHub Pages 部署。

## 📁 檔案結構

```
docs/
├── index.html          # 主頁面，顯示所有測試報告的總覽
├── reports.json        # 報告索引 JSON 檔案
├── reports/            # 個別測試報告資料夾
│   ├── 2025-09-29-22-30-15/
│   │   ├── index.html  # Playwright HTML 報告
│   │   └── data/       # 報告相關資料
│   └── ...
└── README.md           # 說明檔案（本檔案）
```

## 🚀 自動更新

- 當推送程式碼到 `main` 分支時，GitHub Actions 會自動執行測試並更新報告
- 文檔會自動部署到 GitHub Pages
- 最多保留最新的 10 個測試報告

## 🔧 手動操作

### 本地構建文檔
```bash
npm run build:docs
```

### 本地預覽
```bash
cd docs
python -m http.server 8000
# 或使用 Node.js
npx serve .
```

### 手動部署（僅文檔）
可以透過 GitHub Actions 的 "Build and Deploy Docs Only" workflow 手動觸發部署，不會重新執行測試。

## 📊 功能特色

- **報告瀏覽器**：點擊可切換不同時間的報告
- **統計概覽**：通過率、失敗測試數量等
- **響應式設計**：支援手機瀏覽
- **自動清理**：保持最新的報告，避免過多檔案

## 🎯 部署設定

確保在 GitHub repository 設定中：
1. 前往 `Settings` > `Pages`
2. 設定 Source 為 `GitHub Actions`
3. GitHub Actions 會自動部署到 Pages

---

🤖 此文檔由 `scripts/build-docs.js` 自動產生