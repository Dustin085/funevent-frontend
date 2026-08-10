import { NextResponse } from "next/server";
import { clearTokenCookies, getRefreshToken } from "@/lib/auth-cookie";
import { ApiError, MessageResponse } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 登出：清除 httpOnly cookie。
 *
 * 呼叫 spring logout
 */
export async function POST() {
  const refreshToken = await getRefreshToken();
  const body = {
    refreshToken,
  };

  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 網路問題 —— 記錄即可，不中斷登出流程
    console.error("通知 Spring 撤銷 refresh token 失敗");
  }

  // 不論 api 是否有成功打出，前端都要清除 cookies
  await clearTokenCookies();

  return NextResponse.json({ message: "已登出" });
}
