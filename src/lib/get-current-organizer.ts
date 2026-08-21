import { cache } from "react";
import { getAccessToken } from "./auth-cookie";
import { SpringApiError } from "./spring";
import type { OrganizerResponse } from "./api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 目前使用者的主辦者身分，沒有就回 null。
 *
 * ⚠️ 後端對「不是主辦者」回 403（NotOrganizerException）——
 * 這裡把它轉成 null 而不是拋出，因為對呼叫端來說那不是錯誤，
 * 是一個要顯示不同畫面的正常狀態。
 *
 * ⚠️ 但只有 403 轉成 null。連不到後端時**必須讓它拋** ——
 * 顯示「你還不是主辦者」是在騙人，而且使用者會跑去重複建立身分。
 * 這裡和 getCurrentUser() 不同：那個是 layout 呼叫的，
 * 拋出的錯誤 app/error.tsx 攔不到，只能吞掉；這個是頁面呼叫的，攔得到。
 *
 * cache()：同一次請求裡多個元件呼叫只會真的打一次。
 */
export const getCurrentOrganizer = cache(
  async (): Promise<OrganizerResponse | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/api/organizers/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store", // 因人而異的資料，絕不能快取
    });

    // 403 = 還不是主辦者（正常狀態）；401 = token 過期，一樣當成沒有身分
    if (res.status === 403 || res.status === 401) return null;
    if (!res.ok) throw new SpringApiError(res.status, null);
    return res.json();
  },
);
