import { cache } from "react";
import { getAccessToken } from "./auth-cookie";
import type { UserResponse } from "./api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

export const getCurrentUser = cache(async (): Promise<UserResponse | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store", // 因人而異的資料，絕不能快取
    });

    if (!res.ok) return null; // token 過期 → 視為未登入
    return res.json();
  } catch {
    // 連不到後端時渲染成「未登入」，而不是讓整站崩潰。
    // 這個函式是 layout.tsx 呼叫的，而 layout 拋出的錯誤 app/error.tsx 攔不到 ——
    // 沒有這個 catch，後端一關掉全站就變成 global-error 畫面。
    //
    // 判斷跟 proxy.ts 遇到 unavailable 時保留 cookie 一致：
    // 後端暫時掛掉不該讓使用者連瀏覽都不行。
    return null;
  }
});
