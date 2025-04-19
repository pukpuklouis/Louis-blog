/**
 * Cloudflare Worker for Google Indexing API Notification
 * Receives a list of URLs and submits them to the Google Indexing API.
 *
 * Requires the following Secrets configured in Cloudflare Worker settings (via dashboard or wrangler.toml)
 * and accessed via the `env` object passed to the handler:
 * - AUTH_SECRET_TOKEN: A shared secret token for authenticating incoming requests.
 * - GCP_SERVICE_ACCOUNT_PRIVATE_KEY: The private key content from your GCP service account JSON file.
 * - GCP_SERVICE_ACCOUNT_CLIENT_EMAIL: The client email from your GCP service account JSON file.
 *
 * You might need a JWT library compatible with Cloudflare Workers, e.g., `@tsndr/cloudflare-worker-jwt`.
 * If using `@tsndr/cloudflare-worker-jwt`, you might need to bundle your worker code.
 */

// Import JWT library
// Removed import for @tsndr/cloudflare-worker-jwt, using Web Crypto API instead

// Helper function to convert PEM format to ArrayBuffer
function pemToArrayBuffer(pem) {
  // Remove PEM header/footer and line breaks
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, ""); // Remove all whitespace including newlines

  // Decode base64
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Failed to decode base64 or convert PEM to ArrayBuffer:", e);
    throw new Error("Invalid PEM format or base64 decoding failed.");
  }
}

const GOOGLE_INDEXING_API_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const GOOGLE_API_SCOPE = "https://www.googleapis.com/auth/indexing";

export default {
  async fetch(request, env) {
    console.log(`收到請求: ${request.method} ${request.url}`);

    // 驗證請求方法是否為 POST
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 1. 讀取共享密鑰
    const expectedAuthToken = env.AUTH_SECRET_TOKEN;
    if (!expectedAuthToken) {
      console.error("Missing Cloudflare Worker Secret: AUTH_SECRET_TOKEN");
      return new Response(
        "Internal Server Error: Authorization token not configured",
        { status: 500 },
      );
    }

    // 2. 檢查 Authorization 標頭
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        "Unauthorized: Missing or invalid Authorization header",
        { status: 401 },
      );
    }

    // 3. 提取並比較密鑰
    const providedToken = authHeader.substring(7); // Remove "Bearer "
    if (providedToken !== expectedAuthToken) {
      return new Response("Unauthorized: Invalid token", { status: 401 });
    }

    // --- 如果驗證通過，繼續執行原有邏輯 ---

    // 解析請求體 JSON
    let urls;
    try {
      const requestBody = await request.json();
      urls = requestBody.urls;
    } catch (error) {
      return new Response("Invalid JSON or missing 'urls' array", {
        status: 400,
      });
    }

    // 驗證 urls 是否為陣列且非空
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response("'urls' must be a non-empty array", { status: 400 });
    }

    // 從傳入的 env 物件獲取 GCP 服務帳戶私鑰和客戶端 Email
    // 這些值由使用者在 Cloudflare Worker 環境變數中設定為 Secrets
    const gcpPrivateKeyPem = env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY; // Accessing Secret via env
    const gcpClientEmail = env.GCP_SERVICE_ACCOUNT_CLIENT_EMAIL; // Accessing Secret via env

    if (!gcpPrivateKeyPem || !gcpClientEmail) {
      console.error(
        "Missing Cloudflare Worker Secrets: GCP_SERVICE_ACCOUNT_PRIVATE_KEY or GCP_SERVICE_ACCOUNT_CLIENT_EMAIL",
      );
      return new Response("Internal Server Error: Missing required secrets", {
        status: 500,
      });
    }

    // Generate Google API authentication JWT using Web Crypto API
    let jwtToken;
    try {
      console.log("Starting JWT generation..."); // Log start

      // 1. Clean private key PEM
      const privateKeyPemCleaned = gcpPrivateKeyPem.replace(/\\n/g, "\n");
      console.log("Private key PEM cleaned.");

      // 2. Convert PEM to ArrayBuffer
      const privateKeyBuffer = pemToArrayBuffer(privateKeyPemCleaned);
      console.log("PEM converted to ArrayBuffer.");

      // 3. Import private key using Web Crypto API
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
        false, // Key is not extractable for security best practices
        ["sign"],
      );
      console.log("Private key imported successfully.");

      // 4. Define JWT Header and Payload
      const header = { alg: "RS256", typ: "JWT" };
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 3600; // Token expires in 1 hour
      const payload = {
        iss: gcpClientEmail,
        scope: GOOGLE_API_SCOPE,
        aud: "https://oauth2.googleapis.com/token", // Correct Google OAuth 2.0 audience
        exp: exp,
        iat: iat,
      };
      console.log("JWT Header and Payload defined.");

      // Helper function for Base64URL encoding ArrayBuffer -> String -> Base64URL
      function arrayBufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        let base64 = btoa(binary);
        // Replace non-URL-safe characters and remove padding
        base64 = base64
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        return base64;
      }

      // Helper function for Base64URL encoding String -> Base64URL
      function stringToBase64Url(str) {
        // Ensure UTF-8 encoding before btoa for broader compatibility
        const utf8Bytes = new TextEncoder().encode(str);
        let binary = "";
        for (let i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i]);
        }
        let base64 = btoa(binary);
        // Replace non-URL-safe characters and remove padding
        base64 = base64
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        return base64;
      }

      // 5. Encode Header and Payload
      const encodedHeader = stringToBase64Url(JSON.stringify(header));
      const encodedPayload = stringToBase64Url(JSON.stringify(payload));
      console.log("Header and Payload encoded.");

      // 6. Create the signing input
      const signingInput = `${encodedHeader}.${encodedPayload}`;
      const signingInputBuffer = new TextEncoder().encode(signingInput);
      console.log("Signing input created.");

      // 7. Sign the input using Web Crypto API
      const signatureBuffer = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        privateKey,
        signingInputBuffer,
      );
      console.log("Input signed successfully.");

      // 8. Base64URL Encode the signature
      const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
      console.log("Signature encoded.");

      // 9. Assemble the JWT
      jwtToken = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
      console.log("JWT assembled successfully.");
    } catch (error) {
      // Log the error more verbosely before returning the 500 response
      console.error("!!! JWT Generation Failed !!!");
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack); // Log the full stack trace

      // Log specific importKey errors
      if (error instanceof DOMException && error.name === "DataError") {
        console.error(
          "Specific Error Type: Error importing private key (DataError). Check PEM format/conversion.",
        );
      } else if (
        error instanceof TypeError &&
        (error.message.includes("base64") || error.message.includes("btoa"))
      ) {
        console.error(
          "Specific Error Type: Base64 encoding/decoding error during JWT construction.",
        );
      } else if (
        error instanceof Error &&
        error.message.includes("PEM format")
      ) {
        console.error(
          "Specific Error Type: Error in pemToArrayBuffer function. Check PEM format.",
        );
      }
      // Return error details in the response body for easier debugging via the test script
      return new Response(
        JSON.stringify({
          error:
            "Internal Server Error: Could not generate authentication token.",
          details: error.message,
          name: error.name,
          // stack: error.stack // Optionally include stack, but be cautious in production
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }, // Ensure response is JSON
        },
      );
    }

    // --- Step 10: Exchange JWT for Access Token ---
    let accessToken;
    try {
      console.log("Requesting Access Token from Google...");
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwtToken,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error("Failed to obtain Access Token:", tokenData);
        throw new Error(
          `Failed to get access token: ${tokenResponse.status} ${
            tokenResponse.statusText
          } - ${JSON.stringify(tokenData)}`,
        );
      }

      accessToken = tokenData.access_token;
      console.log("Access Token obtained successfully.");
    } catch (error) {
      console.error("Error fetching Access Token:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error: Could not obtain access token.",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // --- Step 11: Call Google Indexing API with Access Token ---
    console.log("Submitting URLs to Google Indexing API...");
    const results = [];
    for (const url of urls) {
      const apiPayload = {
        url: url,
        type: "URL_UPDATED", // Or "URL_DELETED" if needed
      };

      try {
        const apiResponse = await fetch(GOOGLE_INDEXING_API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken, // Use the obtained Access Token
          },
          body: JSON.stringify(apiPayload),
        });

        // Try to parse JSON, but handle cases where response might not be JSON (e.g., errors)
        let responseBody;
        try {
          responseBody = await apiResponse.json();
        } catch (jsonError) {
          // If JSON parsing fails, read as text
          responseBody = await apiResponse.text();
          console.warn(
            `Response from Google API for ${url} was not valid JSON. Status: ${apiResponse.status}. Body: ${responseBody}`,
          );
        }

        if (apiResponse.ok) {
          results.push({ url: url, status: "success", response: responseBody });
          console.info(
            "Successfully submitted URL:",
            url,
            "Response:",
            responseBody,
          );
        } else {
          results.push({
            url: url,
            status: "failed",
            statusCode: apiResponse.status,
            response: responseBody, // Store potentially non-JSON error response
          });
          console.error(
            "Failed to submit URL:",
            url,
            "Status:",
            apiResponse.status,
            "Response:",
            responseBody,
          );
        }
      } catch (error) {
        results.push({ url: url, status: "error", message: error.message });
        console.error("Error submitting URL:", url, "Error:", error);
      }
    }
    console.log("Finished submitting URLs.");

    // --- Step 12: Return results ---
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
      status: 200, // Even if some failed, the overall request to the worker was processed
    });
  },

  // Helper function placeholder for JWT generation - Replace with actual library usage
  // async function generateJwt(clientEmail, privateKey, scope, audience) {
  //     // Implement JWT generation using a library like @tsndr/cloudflare-worker-jwt
  //     // See pseudocode in tech spec for details
  //     throw new Error("JWT generation not implemented");
  // }
};
