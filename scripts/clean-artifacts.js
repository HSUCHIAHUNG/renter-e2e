#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

const ASSETS_DIR = "assets";
const MAX_KEEP_COUNT = 5; // 保留最新的 5 次測試結果

async function getDirectories(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(dir, entry.name),
        stats: null,
      }));
  } catch (error) {
    return [];
  }
}

async function cleanOldAssets() {
  try {
    const projectDirs = ["setup", "member-tests", "guest-tests"];

    for (const projectDir of projectDirs) {
      const fullProjectPath = path.join(ASSETS_DIR, projectDir);
      const timestampDirs = await getDirectories(fullProjectPath);

      if (timestampDirs.length === 0) continue;

      // 獲取每個目錄的創建時間
      for (const dir of timestampDirs) {
        try {
          const stats = await fs.stat(dir.path);
          dir.stats = stats;
        } catch (error) {
          console.warn(`無法取得目錄狀態: ${dir.path}`);
        }
      }

      // 按創建時間排序，保留最新的
      const validDirs = timestampDirs.filter((dir) => dir.stats);
      validDirs.sort((a, b) => b.stats.mtime - a.stats.mtime);

      // 刪除多餘的目錄
      if (validDirs.length > MAX_KEEP_COUNT) {
        const dirsToDelete = validDirs.slice(MAX_KEEP_COUNT);

        for (const dir of dirsToDelete) {
          try {
            await fs.rm(dir.path, { recursive: true, force: true });
            console.log(`已刪除舊的測試結果: ${dir.path}`);
          } catch (error) {
            console.error(`刪除失敗: ${dir.path}`, error.message);
          }
        }
      }

      console.log(
        `${projectDir}: 保留了 ${Math.min(
          validDirs.length,
          MAX_KEEP_COUNT
        )} 個測試結果`
      );
    }
  } catch (error) {
    console.error("清理過程發生錯誤:", error.message);
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanOldAssets();
}

export default cleanOldAssets;
