import { NextResponse } from "next/server";
import { getAccessToken, setTokenCookies } from "@/lib/auth-cookie";
import type { ApiError, AuthResponse } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 改密碼。
 *
 * ⚠️ 這支刻意**不用** proxyToSpring：那個共用函式不碰 cookie，
 * 而改密碼會讓後端撤銷這個使用者的所有 refresh token 並發一組新的 ——
 * 不把新的寫進 cookie 的話，使用者改完密碼後下一次換票就會失敗、
 * 等於把自己登出。形狀照 app/api/auth/login/route.ts。
 */
export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ message: "請先登入" }, { status: 401 });
  }

  const raw = await request.text();

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/users/me/password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: raw,
    });
  } catch {
    return NextResponse.json(
      { message: "無法連線到伺服器，請稍後再試" },
      { status: 502 },
    );
  }

  if (!springResponse.ok) {
    // 400（目前密碼不正確、新密碼太短）、409（第三方帳號沒有密碼）原封不動轉發
    const error: ApiError = await springResponse.json();
    return NextResponse.json(error, { status: springResponse.status });
  }

  const auth: AuthResponse = await springResponse.json();

  // ⭐ 舊 token 已在後端全部撤銷，這裡一定要換上新的
  await setTokenCookies(auth.accessToken, auth.refreshToken);

  // ⚠️ 明確列出欄位，不要 { ...auth } —— 那會把 refreshToken 送到瀏覽器
  return NextResponse.json({
    id: auth.id,
    email: auth.email,
    name: auth.name,
    role: auth.role,
  });
}
