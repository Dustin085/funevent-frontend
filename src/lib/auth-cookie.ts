import {
  ACCESS_TOKEN_COOKIE,
  COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/cookie-config";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

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
 * 把 JWT 寫進「指定的 response」。
 *
 * ⚠️ 和 setTokenCookies 的差別只在寫入方式：那個用 next/headers 的 cookies()，
 * 這個直接寫在自己建的 NextResponse 上。OAuth callback 要回傳一個轉址回應，
 * 兩種寫法混用時 cookie 會不會被合併進去是不確定的，所以那裡統一用後者。
 * 選項來自同一份 cookie-config，不會分岔。
 */
export function setTokenCookiesOn(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
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
