import { getAccessToken } from "./auth-cookie";
import type { ApiError } from "./api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/** Spring 回非 2xx 時拋出，帶著原始狀態碼與錯誤內容供呼叫端判斷 */
export class SpringApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError | null,
  ) {
    super(body?.message ?? `Spring 回應 ${status}`);
    this.name = "SpringApiError";
  }
}

/**
 * 在伺服器端呼叫 Spring。
 *
 * 只能在 Server Component / Route Handler / Server Action 裡使用 ——
 * 它會讀 httpOnly cookie，那是瀏覽器碰不到的東西。
 *
 * Client Component 需要打後端時，一律經過 BFF 的 route handler。
 */
export async function springGet<T>(
  path: string,
  options: { auth?: boolean; revalidate?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    // 預設不快取：活動列表會因發布／下架而變動。
    // 靜態資料（例如分類清單是 enum，除非改程式碼否則不會變）可以傳 revalidate 秒數
    ...(options.revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate: options.revalidate } }),
  });

  if (!res.ok) {
    throw new SpringApiError(res.status, await res.json().catch(() => null));
  }
  return res.json() as Promise<T>;
}
