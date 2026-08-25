import type { AuthResponse } from "./api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 換票的結果。刻意區分「憑證無效」與「後端連不上」——
 * 前者代表 refresh token 真的失效了（過期或觸發竊用偵測），必須清掉 cookie；
 * 後者只是 Spring 暫時掛了，清 cookie 會把所有使用者無謂地登出。
 */
export type RefreshResult =
  | { status: "success"; data: AuthResponse }
  | { status: "invalid" } // Spring 回 401：token 確實失效
  | { status: "unavailable" }; // 連不上 Spring

/**
 * 進行中的換票請求，key 是「舊的 refresh token」。
 *
 * 多個分頁（或 Next <Link> 的預抓取）可能在 AT 過期的同一瞬間各自觸發 proxy，
 * 全部讀到同一個舊 RT。這裡讓同一個 RT 只實際送出一次請求，
 * 其餘共用同一個 Promise、拿到同一組新 token。
 *
 * ⭐ 這只是省下多餘的往返，**不是正確性的前提**。
 * 後端有 reuse interval（寬限期）：寬限期內的重放會拿到同一張票，
 * 所以這個 map 失效也不會造成登出。
 *
 * ⚠ 而它確實會失效 —— 只在單一 Node 程序內有效，部署到 serverless（例如 Vercel）
 * 之後，同一瞬間的請求很可能落在不同執行環境，這個 map 基本上不能依賴。
 * 真正在擋這件事的是後端的寬限期，不是這裡。
 */
const inFlight = new Map<string, Promise<RefreshResult>>();

export async function refreshOnce(
  refreshToken: string,
): Promise<RefreshResult> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  // ⚠ 關鍵：這兩行之間絕對不能有 await。
  // 呼叫 async 函式會「同步」回傳 Promise，所以 get → 呼叫 → set 在 Node 的
  // 事件迴圈中是不可被打斷的。中間一旦 await，其他請求就能插進來、
  // 發現 Map 是空的、又打一次 Spring —— 鎖直接失效。
  const promise = callSpringRefresh(refreshToken);
  inFlight.set(refreshToken, promise);

  try {
    return await promise;
  } finally {
    // 保留幾秒讓「稍晚一點才進來」的請求也能共用結果，之後清除避免 Map 無限成長
    setTimeout(() => inFlight.delete(refreshToken), 10_000);
  }
}

/**
 * 呼叫 Spring 的換票端點。只負責溝通與解析，不碰 cookie——
 * 因為 Route Handler 和 Proxy 寫 cookie 的方式不同，留給呼叫端處理。
 */
async function callSpringRefresh(
  refreshToken: string,
): Promise<RefreshResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return { status: "unavailable" };
  }

  if (!res.ok) return { status: "invalid" };

  return { status: "success", data: await res.json() };
}
