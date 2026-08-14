import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookie";
import type { ApiError } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 下單。這是 BFF 的「寫」側：
 * 觸發點在瀏覽器（按鈕），而 AT 是 httpOnly，前端 JS 讀不到 ——
 * 只能由伺服器端把 token 補上再轉給 Spring。
 */
export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ message: "請先登入" }, { status: 401 });
  }

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // 直接轉發瀏覽器送來的 body，不在這層重新驗證 ——
      // 驗證規則的唯一真相在 Spring 的 @Valid，在這裡複製一份只會兩邊不同步
      body: await request.text(),
    });
  } catch {
    return NextResponse.json(
      { message: "無法連線到伺服器，請稍後再試" },
      { status: 502 },
    );
  }

  const body: unknown = await springResponse.json();
  if (!springResponse.ok) {
    return NextResponse.json(body as ApiError, {
      status: springResponse.status,
    });
  }
  return NextResponse.json(body, { status: springResponse.status });
}
