import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "funevent_access_token";
const REFRESH_TOKEN_COOKIE = "funevent_refresh_token";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 分鐘
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 天

/** 兩個 cookie 共用的安全設定 */
const COOKIE_OPTIONS = {
  // 瀏覽器的 JS 讀不到。BFF 架構的核心，XSS 得手也偷不走 token
  httpOnly: true,
  // 只透過 HTTPS 傳送，開發時是 http://localhost 所以只在正式環境開啟
  secure: process.env.NODE_ENV === "production",
  // CSRF 主要防線：跨站發起的請求不會夾帶
  sameSite: "lax",
  path: "/",
} as const;

/**
 * 把 JWT 寫進 httpOnly cookie。
 * 只能在 Route Handler 或 Server Action 裡呼叫。
 */
export async function setTokenCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies(); // ⚠ Next 15+ 是非同步的

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * 取出 token。Server Component 和 Route Handler 都能用。
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * 登出時清除。
 */
export async function clearTokenCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
