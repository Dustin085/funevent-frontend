import { NextResponse } from 'next/server';
import { setTokenCookies } from '@/lib/auth-cookie';
import type { ApiError, AuthResponse } from '@/lib/api-types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

/**
 * BFF 的登入代理。
 * 瀏覽器 → 這裡（cookie）→ Spring（Bearer token）
 *
 * 這個檔案只在 server 端執行，瀏覽器永遠拿不到 Spring 回傳的 token。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: '請求格式錯誤' },
      { status: 400 },
    );
  }

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Spring 沒開、網路不通 —— 這是「後端掛了」不是「帳密錯誤」，
    // 兩者要分清楚，否則你會花很久找一個不存在的登入 bug
    return NextResponse.json(
      { message: '無法連線到伺服器，請稍後再試' },
      { status: 502 },
    );
  }

  // 帳密錯誤（401）、驗證失敗（400）等，原封不動轉發給前端。
  // 我們在後端統一過錯誤格式，這裡直接沿用就好。
  if (!springResponse.ok) {
    const error: ApiError = await springResponse.json();
    return NextResponse.json(error, { status: springResponse.status });
  }

  const auth: AuthResponse = await springResponse.json();

  // token 存進 httpOnly cookie，不回傳給瀏覽器
  await setTokenCookies(auth.accessToken, auth.refreshToken);

  // ⚠ 明確列出要回傳的欄位，而不是 { ...auth }。
  // 用展開運算子的話，哪天後端在 AuthResponse 加了敏感欄位，
  // 會默默地一起送到瀏覽器。
  return NextResponse.json({
    id: auth.id,
    email: auth.email,
    name: auth.name,
    role: auth.role,
  });
}