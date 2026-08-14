import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookie";
import type { ApiError } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 建立付款。BFF 的「寫」側，跟 /api/orders 同一個模式。
 *
 * ⚠️ 這裡建立的是「付款單」，不是「完成付款」。
 * 真正的付款證明只有金流商伺服器對伺服器打到 Spring 的那個回呼，
 * 那條路徑完全不經過 Next —— 瀏覽器導回來的任何參數都不可信。
 */
export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ message: "請先登入" }, { status: 401 });
  }

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
