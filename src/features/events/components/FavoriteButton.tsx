"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionTooltip } from "./ActionTooltip";
import {
  roundButtonClass,
  roundButtonIconClass,
  roundButtonLabelClass,
} from "./eventActionButtonStyles";
import type { ApiError } from "@/lib/api-types";

/**
 * 活動詳情頁的收藏按鈕。從舊專案的 `.funevent-btn-round` + `add-fav-icon` 移植。
 *
 * ⚠️ 未登入時**仍然顯示**，點下去導向登入頁 —— 跟評論表單的 login-required
 * 是同一個想法：先讓人看到功能存在，藏起來反而讓人以為沒有這個功能。
 *
 * ⚠️ 文案用「收藏」而不是舊版的「蒐藏」，全站統一（側邊欄那項也一起改）。
 */
export function FavoriteButton({
  eventId,
  initialFavorited,
  loginHref,
}: {
  eventId: number;
  /** ⚠️ null 代表未登入（不是「沒收藏」） */
  initialFavorited: boolean | null;
  loginHref: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loggedIn = initialFavorited !== null;

  const toggle = async () => {
    if (!loggedIn) {
      router.push(loginHref);
      return;
    }

    const next = !favorited;
    // ⭐ 樂觀更新：先動畫面，再送請求
    setFavorited(next);
    setError(null);
    setPending(true);

    try {
      const res = await fetch(`/api/events/${eventId}/favorite`, {
        method: next ? "PUT" : "DELETE",
      });

      if (!res.ok) {
        // ⚠️ 失敗一定要把畫面**變回去**。不復原的話畫面顯示已收藏、
        // 資料庫其實沒有，使用者要重新整理才會發現 ——
        // 又是一個「畫面正常但行為不對」
        setFavorited(!next);
        const apiError: ApiError = await res
          .json()
          .catch(() => ({}) as ApiError);
        setError(apiError.message ?? "操作失敗，請稍後再試");
      }
    } catch {
      setFavorited(!next);
      setError("無法連線，請檢查網路");
    } finally {
      setPending(false);
    }
  };

  return (
    // ⚠️ relative 是 ActionTooltip 的定位基準，不能省
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        // aria-pressed 讓螢幕閱讀器知道這是開關而不是一般按鈕，
        // 並且唸得出目前是開還是關。⚠️ 未登入時不給這個屬性 ——
        // 那時它的作用是「去登入」，不是切換狀態
        aria-pressed={loggedIn ? favorited : undefined}
        // ⚠️ 手機版文字被藏起來，沒有這個的話按鈕就沒有可見名稱了。
        // 標籤保持不變、狀態交給 aria-pressed —— 開關類按鈕的標準做法
        aria-label="收藏"
        className={roundButtonClass}
      >
        <Image
          // 舊專案就有兩個檔案，切換 src 即可（同側邊欄圖示的做法）
          src={
            favorited
              ? "/images/add-fav-icon--faved.svg"
              : "/images/add-fav-icon.svg"
          }
          alt=""
          width={24}
          height={24}
          aria-hidden
          className={roundButtonIconClass}
        />
        <span className={roundButtonLabelClass}>收藏</span>
      </button>

      {/* ⚠️ 錯誤也用 tooltip：它跟轉發鈕在同一列，
          在底下插一行字會把整列推開，兩顆按鈕一起跳 */}
      {error && <ActionTooltip tone="error">{error}</ActionTooltip>}
    </div>
  );
}
