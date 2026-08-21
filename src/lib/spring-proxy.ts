import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookie";
import type { ApiError } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 把需要驗證的請求轉發給 Spring。
 *
 * ⚠️ 抽出來是因為第 5 支開始形狀完全一樣：
 * 讀 httpOnly cookie 取 token → 加 Authorization → 轉發 → 轉發錯誤。
 * 各寫一次的話，哪天要加逾時、加重試、改錯誤格式就得改八個檔案。
 *
 * ⚠️ 這裡刻意**不驗證**請求內容。zod 擋的是「使用者打錯字」，
 * 真正的把關在 Spring 的 Bean Validation ——
 * 在中間再驗一次只會變成第三份會走樣的規則。
 */
export async function proxyToSpring(
  request: Request,
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
): Promise<NextResponse> {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ message: "請先登入" }, { status: 401 });
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: string | undefined;

  // DELETE 與部分 PATCH 沒有 body，硬讀會拿到空字串再 JSON.parse 失敗
  if (method !== "DELETE") {
    const raw = await request.text();
    if (raw) {
      headers["Content-Type"] = "application/json";
      body = raw;
    }
  }

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body,
    });
  } catch {
    // Spring 沒開、網路不通 —— 這是「後端掛了」不是「輸入有誤」，
    // 兩者要分清楚，否則會花很久找一個不存在的表單 bug
    return NextResponse.json(
      { message: "無法連線到伺服器，請稍後再試" },
      { status: 502 },
    );
  }

  // 204 No Content 沒有 body，json() 會炸
  if (springResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  if (!springResponse.ok) {
    // 後端已經統一過錯誤格式，原封不動轉發
    const error: ApiError = await springResponse.json();
    return NextResponse.json(error, { status: springResponse.status });
  }

  return NextResponse.json(await springResponse.json(), {
    status: springResponse.status,
  });
}
