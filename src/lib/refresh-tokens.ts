import type { AuthResponse } from "./api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 換票的結果。刻意區分「憑證無效」與「後端連不上」——
 * 前者代表 refresh token 真的失效了（過期或觸發竊用偵測），必須清掉 cookie；
 * 後者只是 Spring 暫時掛了，清 cookie 會把所有使用者無謂地登出。
 */
export type RefreshResult =
  | { status: "success"; data: AuthResponse }
  | { status: "invalid" }       // Spring 回 401：token 確實失效
  | { status: "unavailable" };  // 連不上 Spring

/**
 * 呼叫 Spring 的換票端點。只負責溝通與解析，不碰 cookie——
 * 因為 Route Handler 和 Proxy 寫 cookie 的方式不同，留給呼叫端處理。
 */
export async function callSpringRefresh(refreshToken: string): Promise<RefreshResult> {
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