/**
 * Cookie 名稱與選項的單一來源。
 *
 * ⚠ 為什麼要獨立成一個檔案：auth-cookie.ts 用 next/headers 的 cookies()（Route Handler 用），
 * proxy.ts 用 request.cookies / response.cookies（Proxy 用）——兩者 API 不同、無法共用函式，
 * 但「cookie 叫什麼名字、效期多長」必須完全一致。抽出來避免改了一邊忘了另一邊。
 */
export const ACCESS_TOKEN_COOKIE = "funevent_access_token";
export const REFRESH_TOKEN_COOKIE = "funevent_refresh_token";

/** 對齊後端 app.access-token.expiration（900000 毫秒） */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
/** 對齊後端 app.refresh-token.expiration（604800000 毫秒） */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** 兩個 cookie 共用的安全設定 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
