"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 分頁重新被看到時，重新取一次 Server Component 的資料。
 *
 * <p>⭐ 解決的是同一類問題：**畫面上的東西是伺服器在某個時間點算好的，
 * 而那件事後來在別的地方變了**。這個站上至少有兩個實例：
 * <ul>
 *   <li>A 分頁登出後，B 分頁的 Topbar 還顯示登入中</li>
 *   <li>票券被主辦者核銷後，買家頁面還顯示「可入場」</li>
 *   <li>token 自然過期、或在另一台裝置改密碼被登出</li>
 * </ul>
 *
 * ⭐ 時機剛好對上：這些過期狀態只有在「使用者切回來看」的那一刻才有意義，
 * 而那正是 visibilitychange 觸發的時候。閒置時完全不發請求。
 *
 * ⚠️ 但它<b>解決不了「頁面一直開著時的變化」</b> —— 被掃描的當下買家正舉著手機，
 * 分頁沒有隱藏過，這個事件不會觸發。那種情況要靠輪詢（見 TicketCard）。
 */
export function RefreshOnVisible() {
  const router = useRouter();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);

  return null;
}
