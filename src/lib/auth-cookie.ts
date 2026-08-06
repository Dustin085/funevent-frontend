import { cookies } from 'next/headers';

const TOKEN_COOKIE = 'funevent_token';

/** 對齊後端 app.jwt.expiration（3600000 毫秒 = 1 小時） */
export const TOKEN_MAX_AGE_SECONDS = 60 * 60;

/**
 * 把 JWT 寫進 httpOnly cookie。
 * 只能在 Route Handler 或 Server Action 裡呼叫。
 */
export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();   // ⚠ Next 15+ 是非同步的

  cookieStore.set(TOKEN_COOKIE, token, {
    // 瀏覽器的 JS 讀不到這筆 cookie。這是整個 BFF 架構的核心，
    // XSS 就算得手也偷不走 token。
    httpOnly: true,

    // 只透過 HTTPS 傳送。開發時是 http://localhost，所以只在正式環境開啟。
    secure: process.env.NODE_ENV === 'production',

    // CSRF 的主要防線：跨站發起的請求不會夾帶這個 cookie。
    // 改用 cookie 之後 CSRF 的攻擊前提就回來了，這行是必要的。
    sameSite: 'lax',

    path: '/',
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * 取出 token。Server Component 和 Route Handler 都能用。
 */
export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

/**
 * 登出時清除。
 */
export async function clearTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}