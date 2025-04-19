#!/usr/bin/env node

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import fetch from "node-fetch"; // Use node-fetch for compatibility

const ARTICLES_DIR = path.join(process.cwd(), "src", "content", "blog");
const LAST_TRIGGER_FILE = path.join(process.cwd(), ".last_triggered_timestamp");
const PENDING_URLS_FILE = path.join(process.cwd(), ".pending_urls.json");
const DEBOUNCE_DELAY_MS = 5000; // 5 秒 Debounce 延遲

// 從環境變數讀取 Cloudflare Worker 的 URL 和網站域名
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const SITE_DOMAIN = process.env.SITE_DOMAIN;

// 狀態變數 (在單例執行環境中有效，例如使用文件鎖)
let debounceTimer = null;

async function main() {
  // 檢查必要的環境變數
  if (!WORKER_URL || !SITE_DOMAIN) {
    console.error(
      "Missing required environment variables: CLOUDFLARE_WORKER_URL and SITE_DOMAIN",
    );
    process.exit(1); // 終止腳本
  }

  // 獲取上次觸發時間戳
  const lastTriggerTimestamp = readLastTriggerTimestamp();

  // 掃描文章目錄並識別需要提交的文章
  const articlesToSubmit = scanArticles(ARTICLES_DIR, lastTriggerTimestamp);

  if (articlesToSubmit.length > 0) {
    // 生成需要提交的完整 URL 列表
    const urlsToSubmit = generateUrls(articlesToSubmit, SITE_DOMAIN);

    // 將 URL 列表添加到暫存文件
    appendUrlsToPendingFile(urlsToSubmit);

    // 啟動或重設定時器
    startOrResetDebounceTimer();
  } else {
    console.info("No new articles to submit.");
  }
}

function readLastTriggerTimestamp() {
  try {
    if (fs.existsSync(LAST_TRIGGER_FILE)) {
      const timestamp = fs.readFileSync(LAST_TRIGGER_FILE, "utf-8");
      return parseInt(timestamp, 10) || 0;
    } else {
      return 0; // 如果文件不存在，視為從未觸發過
    }
  } catch (error) {
    console.error("Error reading last trigger timestamp:", error);
    return 0; // 讀取失敗也視為從未觸發過
  }
}

function scanArticles(directory, lastTriggerTimestamp) {
  const articlesToSubmit = [];
  let files = [];
  try {
    files = fs.readdirSync(directory);
  } catch (error) {
    console.error(`Error reading articles directory ${directory}:`, error);
    return articlesToSubmit;
  }

  for (const file of files) {
    if (file.endsWith(".md") || file.endsWith(".mdx")) {
      const filePath = path.join(directory, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const frontmatter = matter(fileContent); // 使用 gray-matter 解析 Frontmatter

        // 識別邏輯：基於發布日期或特定標記
        const publishDate = frontmatter.data.publishDate
          ? new Date(frontmatter.data.publishDate).getTime()
          : null;
        const needsIndexing = frontmatter.data.index_api === true;

        if (
          (publishDate !== null && publishDate > lastTriggerTimestamp) ||
          needsIndexing
        ) {
          articlesToSubmit.push({
            filePath: filePath,
            slug: getArticleSlug(file),
          }); // 假設 getArticleSlug 從文件名獲取 slug
        }
      } catch (error) {
        console.error("Error processing file:", filePath, error);
      }
    }
  }

  return articlesToSubmit;
}

function getArticleSlug(fileName) {
  // Remove file extension and potentially date prefix if your slug is just the name
  // Example: '2023-10-27-my-article.md' -> 'my-article'
  // This is a placeholder, adjust based on your actual slug generation logic
  const baseName = path.basename(fileName, path.extname(fileName));
  // Simple example: remove date prefix like 'YYYY-MM-DD-'
  const slugMatch = baseName.match(/^\d{4}-\d{2}-\d{2}-(.*)$/);
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1];
  }
  return baseName; // Fallback to just the base name
}

function generateUrls(articles, domain) {
  const urls = [];
  for (const article of articles) {
    // Assuming blog post path structure like https://your-domain.com/blog/your-slug
    urls.push(`https://${domain}/blog/${article.slug}`);
  }
  return urls;
}

function appendUrlsToPendingFile(urls) {
  // TODO: Implement file locking for robust concurrent access in CI/CD
  try {
    const existingUrls = fs.existsSync(PENDING_URLS_FILE)
      ? JSON.parse(fs.readFileSync(PENDING_URLS_FILE, "utf-8"))
      : [];
    const combinedUrls = [...new Set([...existingUrls, ...urls])]; // 合併並去重
    fs.writeFileSync(PENDING_URLS_FILE, JSON.stringify(combinedUrls, null, 2));
    console.info(
      `Appended ${urls.length} URLs to pending file. Total pending: ${combinedUrls.length}`,
    );
  } catch (error) {
    console.error("Error appending URLs to pending file:", error);
  }
}

function startOrResetDebounceTimer() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(processPendingUrls, DEBOUNCE_DELAY_MS);
  console.info(`Debounce timer started/reset for ${DEBOUNCE_DELAY_MS}ms.`);
}

async function processPendingUrls() {
  // TODO: Implement file locking for robust single instance execution
  debounceTimer = null; // Clear timer reference

  try {
    if (fs.existsSync(PENDING_URLS_FILE)) {
      const urlsToProcess = JSON.parse(
        fs.readFileSync(PENDING_URLS_FILE, "utf-8"),
      );

      if (urlsToProcess.length > 0) {
        console.info(`Processing pending URLs: ${urlsToProcess.length}`);
        // 向 Cloudflare Worker 發送請求
        const success = await sendUrlsToWorker(urlsToProcess, WORKER_URL);

        if (success) {
          // 清空暫存文件
          fs.unlinkSync(PENDING_URLS_FILE);
          // 更新上次觸發時間戳
          updateLastTriggerTimestamp();
          console.info(
            "Successfully processed pending URLs and updated timestamp.",
          );
        } else {
          console.error(
            "Failed to send URLs to Worker. Pending URLs kept for next run.",
          );
        }
      } else {
        console.info("Pending URLs file is empty.");
        // 如果文件存在但為空，也刪除它
        fs.unlinkSync(PENDING_URLS_FILE);
      }
    } else {
      console.info("Pending URLs file does not exist.");
    }
  } catch (error) {
    console.error("Error processing pending URLs:", error);
  }
}

async function sendUrlsToWorker(urls, workerUrl) {
  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: urls }),
    });

    if (response.ok) {
      const responseBody = await response.json();
      console.info("Worker response:", responseBody);
      return true;
    } else {
      console.error(
        "Worker request failed:",
        response.status,
        await response.text(),
      );
      return false;
    }
  } catch (error) {
    console.error("Error sending URLs to Worker:", error);
    return false;
  }
}

function updateLastTriggerTimestamp() {
  try {
    fs.writeFileSync(LAST_TRIGGER_FILE, Date.now().toString());
  } catch (error) {
    console.error("Error updating last trigger timestamp:", error);
  }
}

// 腳本入口點
main();
