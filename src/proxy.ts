import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/cookie-config";
import { refreshOnce } from "@/lib/refresh-tokens";

/**
 * 在頁面渲染之前攔截請求，必要時自動換票。
 *
 * 為什麼一定要放在這裡而不是 Server Component：
 * Next.js 禁止在 Server Component 渲染期間寫 cookie，
 * 而換票必然要寫入新的 token —— 加上輪替機制下，
 * 換到新 token 卻存不起來會導致舊的已作廢、新的遺失，使用者直接被登出。
 *
 * ⚠ 檔名是 proxy.ts 不是 middleware.ts —— Next 16 已將後者標記為棄用。
 */
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // AT 還在 → 不需要做任何事，這是絕大多數請求會走的路徑
  if (accessToken) {
    return NextResponse.next();
  }

  // 兩個都沒有 → 就是未登入，讓頁面自己處理（顯示登入表單或導向）
  if (!refreshToken) {
    return NextResponse.next();
  }

  // AT 過期被瀏覽器自動刪除，但 RT 還在 → 換票
  const result = await refreshOnce(refreshToken);

  // Spring 連不上：保留 cookie，讓使用者暫時以未登入狀態瀏覽。
  // 不清 cookie 是刻意的 —— 後端恢復後下一次請求就會自動換票成功
  if (result.status === "unavailable") {
    return NextResponse.next();
  }

  // RT 確實失效（過期，或觸發了後端的竊用偵測導致整條 family 被撤銷）
  // → 必須清掉，否則之後每一個請求都會重試換票、每次都失敗
  if (result.status === "invalid") {
    const response = NextResponse.next();
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    result.data;

  // ⚠ 關鍵：要同時做兩件事，只做一件是最常見的錯誤
  //
  // ① 改寫「往下傳的請求」，讓「這一次」的頁面渲染就讀得到新 AT。
  //    少了這步，換票成功但當次渲染仍顯示未登入，要重新整理才正常。
  request.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ② 寫回瀏覽器，供「之後」的請求使用
  response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}

/**
 * ⚠ matcher 是必要的，不是可選的。
 * 沒有它，proxy 會在每一個請求上執行——包含 Topbar 那六張 SVG、
 * _next/static 的每個 JS chunk，每一個都會觸發一次換票檢查。
 *
 * ⚠️ 曾經排除過 api，那是錯的：BFF 的 route handler 只會讀 cookie，
 * 不會換票 —— 於是使用者閒置超過 AT 效期後，換頁正常但「按任何按鈕」
 * 都會得到 401。client 端動作同樣需要 proxy 先把票換好。
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"],
};
