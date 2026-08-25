"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api-types";

/**
 * 刪除自己的評論。
 *
 * ⚠️ 需要 client 元件：「我的評論」頁是 Server Component，
 * 而刪除要 onClick 加上刪完的 router.refresh()。
 *
 * ⚠️ 確認做成兩段式，不用 window.confirm —— 那是原生對話框，
 * 樣式不可控、按鈕文案是系統語言的，跟站上其他地方對不起來。
 */
export function DeleteCommentButton({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/me/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // 403 = 不是自己的評論；404 = 已經被刪掉了
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "刪除失敗，請稍後再試");
        return;
      }

      // 列表是 Server Component 取的，refresh 才會少掉這一則
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <p role="alert" className="text-[14px] text-red-600">
        {error}
      </p>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-red-600"
      >
        刪除
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-[14px]">
      {/* ⚠️ 講清楚不可復原 —— 刪掉之後內容就沒了，
          雖然可以重新評論，但原本寫的字不會回來 */}
      <span className="text-ink-muted">確定刪除？</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="text-ink-soft transition-opacity duration-[350ms] hover:opacity-70 disabled:opacity-40"
      >
        取消
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="font-medium text-red-600 transition-opacity duration-[350ms] hover:opacity-70 disabled:opacity-40"
      >
        {deleting ? "刪除中…" : "刪除"}
      </button>
    </div>
  );
}
