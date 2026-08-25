/**
 * Cookie 名稱與選項的單一來源。
 *
 * ⚠ 為什麼要獨立成一個檔案：auth-cookie.ts 用 next/headers 的 cookies()（Route Handler 用），
 * proxy.ts 用 request.cookies / response.cookies（Proxy 用）——兩者 API 不同、無法共用函式，
 * 但「cookie 叫什麼名字、效期多長」必須完全一致。抽出來避免改了一邊忘了另一邊。
 */
export const ACCESS_TOKEN_COOKIE = "funevent_access_token";
export const REFRESH_TOKEN_COOKIE = "funevent_refresh_token";

/** 對齊後端 app.access-token.expiration（900000 毫秒）。⚠️ 後端改了這裡要跟著改 */
const ACCESS_TOKEN_EXPIRATION_SECONDS = 15 * 60;

/**
 * ⭐ cookie 的效期刻意「比 JWT 的 exp 短一分鐘」，這是安全邊際不是筆誤。
 *
 * proxy.ts 判斷要不要換票的依據是「AT cookie 還在不在」。兩者效期若設成
 * 完全一樣，中間會出現一段死角：cookie 剩最後幾秒時 proxy 判定「AT 還在，
 * 不用換票」，但頁面渲染時打到 Spring，JWT 已經過期 → 401 → 畫面顯示成未登入。
 *
 * 讓 cookie 早一步消失，proxy 就永遠在 JWT 真正失效「之前」換到新票。
 */
const REFRESH_MARGIN_SECONDS = 60;
export const ACCESS_TOKEN_MAX_AGE_SECONDS =
  ACCESS_TOKEN_EXPIRATION_SECONDS - REFRESH_MARGIN_SECONDS;

/** 對齊後端 app.refresh-token.expiration（604800000 毫秒） */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * OAuth 流程進行中的暫存。三個都只活 10 分鐘，callback 一回來就清掉。
 *
 * ⚠️ sameSite 必須沿用 COOKIE_OPTIONS 的 "lax"，不能改成 "strict" ——
 * 從 Google 轉回來是「跨站導覽」，strict 會讓這些 cookie 不被送出，
 * state 比對就永遠失敗。
 */
export const OAUTH_STATE_COOKIE = "funevent_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "funevent_oauth_verifier";
export const OAUTH_NEXT_COOKIE = "funevent_oauth_next";
/** 夠使用者在 Google 那邊登入、選帳號、過兩階段驗證。太長只是多一個攻擊面 */
export const OAUTH_FLOW_MAX_AGE_SECONDS = 10 * 60;

/** 兩個 cookie 共用的安全設定 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
