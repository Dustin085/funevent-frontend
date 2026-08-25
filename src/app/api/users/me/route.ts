import { proxyToSpring } from "@/lib/spring-proxy";

/**
 * ⚠️ 這裡原本有一支 GET，已經刪掉：它沒有任何呼叫端，而且 fetch 時
 * 根本沒帶 Authorization header（真的被呼叫也只會 401）。
 * Server Component 讀使用者一律走 lib/get-current-user.ts 直接打 Spring，
 * 不經過 BFF —— 那條路徑本來就拿得到 httpOnly cookie。
 */
export async function PATCH(request: Request) {
  return proxyToSpring(request, "/api/users/me", "PATCH");
}
