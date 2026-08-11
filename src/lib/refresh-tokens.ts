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
 * ⚠ 為什麼需要：多個分頁（或 Next <Link> 的預抓取）可能在 AT 過期的同一瞬間
 * 各自觸發 proxy，全部讀到同一個舊 RT。若各自打 Spring，第二個之後會撞上
 * 「已使用的 RT」→ 觸發後端的竊用偵測 → 整條 family 被撤銷 → 使用者莫名被登出。
 *
 * 解法：同一個 RT 只實際送出一次請求，其餘共用同一個 Promise、拿到同一組新 token。
 * 對 Spring 而言只發生了一次輪替。
 *
 * ⚠ 限制：只在單一 Node 程序內有效。水平擴展成多台實例或部署到 serverless 時會失效，
 * 那時需要後端的 reuse interval（寬限期）來兜底。
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
