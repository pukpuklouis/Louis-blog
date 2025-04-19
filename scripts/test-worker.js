import fetch from "node-fetch"; // 需要安裝 node-fetch
import dotenv from "dotenv"; // 需要安裝 dotenv

dotenv.config(); // 載入 .env 檔案中的環境變數

// Get Cloudflare Worker URL and Auth Token from .env file
const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
const authToken = process.env.AUTH_SECRET_TOKEN;

if (!workerUrl || !authToken) {
  console.error(
    "Please set CLOUDFLARE_WORKER_URL and AUTH_SECRET_TOKEN in your .env file",
  );
  process.exit(1);
}

const urlsToSubmit = [
  // "https://blogs.itslouis.cc/blog/2025-business-growth-guide-expansion-stages-profit-sources/",
  // 您可以在此添加更多要測試的 URL
];

async function testWorker() {
  try {
    console.log(`從 .env 載入的 Worker URL: ${workerUrl}`);
    console.log(
      `從 .env 載入的 Auth Token (部分顯示): ${authToken ? authToken.substring(0, 5) + "..." : "未設定"}`,
    );
    console.log(`正在向 Worker 發送請求: ${workerUrl}`);
    console.log("提交的 URL 列表:", urlsToSubmit);

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ urls: urlsToSubmit }),
    });

    console.log("Worker 響應狀態碼:", response.status);
    const responseText = await response.text();
    console.log("Worker 原始響應內容:", responseText);

    try {
      const responseBody = JSON.parse(responseText);
      console.log("Worker 解析後的響應內容:", responseBody);
      if (response.ok) {
        console.log("請求成功。請檢查響應內容以確認每個 URL 的處理結果。");
      } else {
        console.error("請求失敗。請檢查狀態碼和響應內容以診斷問題。");
      }
    } catch (jsonError) {
      console.error("無法解析 Worker 響應為 JSON:", jsonError);
      if (response.ok) {
        console.log("請求成功 (非 JSON 響應)。請檢查原始響應內容。");
      } else {
        console.error(
          "請求失敗 (非 JSON 響應)。請檢查狀態碼和原始響應內容以診斷問題。",
        );
      }
    }
  } catch (error) {
    console.error("發送請求時發生錯誤:", error);
  }
}

testWorker();
