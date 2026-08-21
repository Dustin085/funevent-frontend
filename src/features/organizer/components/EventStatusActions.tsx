"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError, EventStatus } from "@/lib/api-types";

/**
 * 發布 / 取消活動。
 *
 * ⚠️ 前端**不預判**規則。發布要求「至少一個票種」「活動還沒開始」「必須是草稿」，
 * 取消要求「沒有已付款的訂單」—— 這些全部只寫在後端一處。
 * 前端照樣送出，被拒絕就把後端的訊息顯示出來。
 *
 * 在前端複製一份規則的話，兩邊遲早不一致，而且不一致時**前端會贏**
 *（使用者根本按不下去），真正的規則反而被遮住。
 */
export function EventStatusActions({
  eventId,
  status,
}: {
  eventId: number;
  status: EventStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "publish" | "cancel") => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/${action}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "操作失敗，請稍後再試");
        return;
      }
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === "DRAFT" && (
          <button
            type="button"
            onClick={() => run("publish")}
            disabled={loading}
            className="rounded-[10px] bg-brand px-5 py-2 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "處理中…" : "發布活動"}
          </button>
        )}
        {status !== "CANCELLED" && (
          <button
            type="button"
            onClick={() => run("cancel")}
            disabled={loading}
            className="rounded-[10px] border border-[#d9d9d9] px-5 py-2 text-ink-soft transition-colors duration-[350ms] hover:text-red-600 disabled:opacity-50"
          >
            取消活動
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="max-w-[320px] text-right text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
