#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '..', 'assets', 'html-report');
const DAYS_TO_KEEP = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function cleanupOldReports() {
  try {
    // 檢查 html-report 資料夾是否存在
    try {
      await fs.access(REPORTS_DIR);
    } catch (error) {
      console.log('📁 assets/html-report 資料夾不存在，無需清理');
      return;
    }

    console.log(`🧹 開始清理超過 ${DAYS_TO_KEEP} 天的 HTML 報告...`);
    console.log(`📂 清理目標：${REPORTS_DIR}`);

    const entries = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());

    if (directories.length === 0) {
      console.log('📭 沒有找到任何報告資料夾');
      return;
    }

    const now = Date.now();
    const cutoffTime = now - (DAYS_TO_KEEP * MS_PER_DAY);

    let deletedCount = 0;
    let keptCount = 0;
    const sortedDirs = [];

    // 收集所有資料夾信息並按修改時間排序
    for (const dir of directories) {
      const dirPath = path.join(REPORTS_DIR, dir.name);
      try {
        const stats = await fs.stat(dirPath);
        sortedDirs.push({
          name: dir.name,
          path: dirPath,
          mtime: stats.mtime.getTime()
        });
      } catch (error) {
        console.log(`⚠️  無法讀取資料夾統計資訊：${dir.name}`);
      }
    }

    // 按修改時間排序（最新的在前）
    sortedDirs.sort((a, b) => b.mtime - a.mtime);

    // 至少保留最新的一個報告
    for (let i = 0; i < sortedDirs.length; i++) {
      const dir = sortedDirs[i];
      const isOld = dir.mtime < cutoffTime;
      const isLast = i === sortedDirs.length - 1;

      if (isOld && !isLast) {
        try {
          await fs.rm(dir.path, { recursive: true, force: true });
          const ageInDays = Math.floor((now - dir.mtime) / MS_PER_DAY);
          console.log(`🗑️  已刪除：${dir.name} (${ageInDays} 天前)`);
          deletedCount++;
        } catch (error) {
          console.log(`❌ 刪除失敗：${dir.name} - ${error.message}`);
        }
      } else {
        const ageInDays = Math.floor((now - dir.mtime) / MS_PER_DAY);
        const reason = isLast ? '(最新報告，保留)' : `(${ageInDays} 天前，保留)`;
        console.log(`📄 保留：${dir.name} ${reason}`);
        keptCount++;
      }
    }

    console.log('\n✨ 清理完成！');
    console.log(`📊 統計：刪除 ${deletedCount} 個，保留 ${keptCount} 個資料夾`);

  } catch (error) {
    console.error('❌ 清理過程發生錯誤：', error.message);
    process.exit(1);
  }
}

// 執行清理
cleanupOldReports();