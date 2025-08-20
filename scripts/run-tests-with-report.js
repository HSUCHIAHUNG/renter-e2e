#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * 生成基於時間戳的報告目錄名稱
 */
function generateReportDirName() {
  const now = new Date();

  // 使用本地時間格式
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  const timestamp = `${year}-${month}-${day}_${hour}-${minute}-${second}`;

  return `playwright-report_${timestamp}`;
}

/**
 * 清理舊報告（保留最新的N個報告）
 */
function cleanOldReports(reportsDir, keepCount = 10) {
  try {
    if (!fs.existsSync(reportsDir)) {
      return;
    }

    const reports = fs
      .readdirSync(reportsDir)
      .filter((dir) => dir.startsWith("playwright-report_"))
      .map((dir) => ({
        name: dir,
        path: path.join(reportsDir, dir),
        mtime: fs.statSync(path.join(reportsDir, dir)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime); // 按修改時間降序排列

    // 刪除超過保留數量的舊報告
    if (reports.length > keepCount) {
      const toDelete = reports.slice(keepCount);
      toDelete.forEach((report) => {
        fs.rmSync(report.path, { recursive: true, force: true });
        console.log(`已刪除舊報告: ${report.name}`);
      });
    }

    console.log(`保留了最新的 ${Math.min(reports.length, keepCount)} 個報告`);
  } catch (error) {
    console.warn("清理舊報告時發生錯誤:", error.message);
  }
}

/**
 * 執行 Playwright 測試並生成帶時間戳的報告
 */
async function runTestsWithTimestampedReport() {
  // 從命令行參數獲取測試選項
  const args = process.argv.slice(2);

  // 生成報告目錄名稱
  const reportDir = generateReportDirName();
  const reportsBaseDir = "test-reports";
  const fullReportPath = path.join(reportsBaseDir, reportDir);

  // 確保報告基礎目錄存在
  if (!fs.existsSync(reportsBaseDir)) {
    fs.mkdirSync(reportsBaseDir, { recursive: true });
  }

  // 構建 Playwright 命令
  const playwrightArgs = ["test", "--reporter=html", ...args];

  // 設置環境變數來指定報告輸出路徑
  process.env.PLAYWRIGHT_HTML_REPORT = fullReportPath;

  console.log(`開始執行測試...`);
  console.log(`報告將保存至: ${fullReportPath}`);
  console.log(`執行命令: npx playwright ${playwrightArgs.join(" ")}`);

  // 執行測試
  const child = spawn("npx", ["playwright", ...playwrightArgs], {
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    console.log(`\n測試執行完成，退出碼: ${code}`);
    console.log(`測試報告已保存至: ${fullReportPath}`);
    console.log(`查看報告: npx playwright show-report ${fullReportPath}`);

    // 清理舊報告
    cleanOldReports(reportsBaseDir);

    // 創建最新報告的符號連結（方便快速訪問）
    const latestLink = path.join(reportsBaseDir, "latest");
    try {
      if (fs.existsSync(latestLink)) {
        fs.unlinkSync(latestLink);
      }
      fs.symlinkSync(reportDir, latestLink);
      console.log(`最新報告連結已更新: ${latestLink}`);
    } catch (error) {
      console.warn("創建最新報告連結失敗:", error.message);
    }
  });

  child.on("error", (error) => {
    console.error("執行測試時發生錯誤:", error);
    process.exit(1);
  });
}

// 執行主函數
runTestsWithTimestampedReport().catch((error) => {
  console.error("執行失敗:", error);
  process.exit(1);
});
