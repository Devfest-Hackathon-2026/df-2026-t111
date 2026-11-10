#!/usr/bin/env node

/**
 * プロジェクト内のすべての外部リンク（URL）を自動検証するスクリプト
 * 使い方: node scripts/check-links.mjs (または npm run check:links)
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

const TARGET_DIRS = ["src/data", "src/components"];
const ALLOWED_EXTS = [".ts", ".tsx", ".js", ".jsx"];

// 検証から除外するURLパターン（テンプレート変数、モック、ローカルホストなど）
const IGNORE_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /emulatorHost/,
  /\$\{/,
  /watch\?v=○○/,
  /fonts\.googleapis\.com/, // CSSフォント定義
  /developers\.google\.com/,
  /maps\.google\.com\/maps\?.*output=embed/, // Google Mapsのiframe埋め込み用URL（直接HTTPアクセス不可仕様）
];

function collectFiles(dir) {
  const files = [];
  try {
    for (const item of readdirSync(dir)) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectFiles(fullPath));
      } else if (ALLOWED_EXTS.includes(extname(fullPath))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`ディレクトリ読み込みエラー: ${dir}`, err);
  }
  return files;
}

function extractUrlsFromFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results = [];

  const urlRegex = /(https?:\/\/[^\s'"`,;)}<>]+)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = urlRegex.exec(line)) !== null) {
      const url = match[1];
      if (IGNORE_PATTERNS.some((pattern) => pattern.test(url))) {
        continue;
      }
      results.push({
        url,
        file: filePath,
        line: index + 1,
      });
    }
  });

  return results;
}

async function checkUrl(url) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // まず HEAD で試す（速いため）
    let res = await fetch(url, {
      method: "HEAD",
      headers,
      signal: controller.signal,
      redirect: "follow",
    });

    // 403 や 405 (Method Not Allowed) の場合は GET で再試行
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "follow",
      });
    }

    clearTimeout(timeoutId);

    if (res.ok) {
      return { ok: true, status: res.status };
    } else {
      return { ok: false, status: res.status, error: `HTTP ${res.status} ${res.statusText}` };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, status: 0, error: err.name === "AbortError" ? "Timeout (10s)" : err.message };
  }
}

async function main() {
  console.log("🔍 プロジェクト内の外部リンクを検証中...\n");

  const allFiles = TARGET_DIRS.flatMap((dir) => collectFiles(dir));
  const urlEntries = allFiles.flatMap((file) => extractUrlsFromFile(file));

  // 重複URLをグルーピング
  const urlMap = new Map();
  for (const entry of urlEntries) {
    if (!urlMap.has(entry.url)) {
      urlMap.set(entry.url, []);
    }
    urlMap.get(entry.url).push(entry);
  }

  const uniqueUrls = Array.from(urlMap.keys());
  console.log(`対象ファイル数: ${allFiles.length} 件`);
  console.log(`検証対象リンク数: ${uniqueUrls.length} 件 (出現箇所: ${urlEntries.length} 箇所)\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // 並行して検証（最大5並列）
  const concurrency = 5;
  const queue = [...uniqueUrls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      const occurrences = urlMap.get(url);
      const result = await checkUrl(url);

      if (result.ok) {
        successCount++;
        console.log(`  \x1b[32m✓\x1b[0m [${result.status}] ${url}`);
      } else {
        errorCount++;
        console.log(`  \x1b[31m✗\x1b[0m [${result.status || "ERR"}] ${url} -> ${result.error}`);
        errors.push({ url, occurrences, error: result.error });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log("\n-------------------------------------------");
  console.log(`検証結果: 成功 \x1b[32m${successCount}\x1b[0m 件 / 失敗 \x1b[31m${errorCount}\x1b[0m 件`);
  console.log("-------------------------------------------\n");

  if (errorCount > 0) {
    console.error("\x1b[31m以下のリンクでエラーが検出されました:\x1b[0m\n");
    for (const item of errors) {
      console.error(`- URL: ${item.url}`);
      console.error(`  エラー: ${item.error}`);
      console.error(`  出現箇所:`);
      for (const occ of item.occurrences) {
        console.error(`    • ${occ.file}:${occ.line}`);
      }
      console.error("");
    }
    process.exit(1);
  } else {
    console.log("\x1b[32m🎉 すべての外部リンクが正常に接続可能です！\x1b[0m\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
