#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * 清理測試報告腳本
 */
function cleanReports() {
  const reportsDir = 'test-reports';
  const keepCount = parseInt(process.argv[2]) || 5; // 預設保留5個報告

  console.log(`開始清理測試報告，保留最新的 ${keepCount} 個報告...`);

  try {
    if (!fs.existsSync(reportsDir)) {
      console.log('測試報告目錄不存在，無需清理');
      return;
    }

    const reports = fs.readdirSync(reportsDir)
      .filter(dir => {
        const fullPath = path.join(reportsDir, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('playwright-report_');
      })
      .map(dir => ({
        name: dir,
        path: path.join(reportsDir, dir),
        mtime: fs.statSync(path.join(reportsDir, dir)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // 按修改時間降序排列

    console.log(`找到 ${reports.length} 個測試報告`);

    if (reports.length <= keepCount) {
      console.log('報告數量未超過保留限制，無需清理');
      return;
    }

    // 刪除超過保留數量的舊報告
    const toDelete = reports.slice(keepCount);
    toDelete.forEach(report => {
      try {
        fs.rmSync(report.path, { recursive: true, force: true });
        console.log(`✓ 已刪除: ${report.name}`);
      } catch (error) {
        console.error(`✗ 刪除失敗: ${report.name} - ${error.message}`);
      }
    });

    console.log(`\n清理完成！保留了最新的 ${keepCount} 個報告，刪除了 ${toDelete.length} 個舊報告`);

    // 顯示剩餘報告
    const remaining = reports.slice(0, keepCount);
    if (remaining.length > 0) {
      console.log('\n保留的報告:');
      remaining.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.name} (${report.mtime.toLocaleString()})`);
      });
    }

  } catch (error) {
    console.error('清理測試報告時發生錯誤:', error.message);
    process.exit(1);
  }
}

// 執行清理
cleanReports();