"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError, OrganizerResponse } from "@/lib/api-types";

/**
 * 主辦者身分的建立與編輯。
 *
 * ⚠️ 只有兩個欄位，沿用 LoginForm 的手寫 useState 模式 ——
 * 不值得為它引入表單函式庫。活動表單（9 個欄位 + 可增刪的圖片與票種陣列）才需要。
 *
 * ⚠️ 建立與編輯共用同一個元件而不是複製一份：兩者只差方法、按鈕文字、
 * 送出後的去向。複製出來的話，以後多加一個欄位很容易只改到一邊。
 */
export function OrganizerSetupForm({
  organizer,
}: {
  /** 有值就是編輯模式，沒有就是建立 */
  organizer?: OrganizerResponse;
}) {
  const router = useRouter();
  const isEdit = organizer !== undefined;

  const [name, setName] = useState(organizer?.name ?? "");
  const [introduction, setIntroduction] = useState(
    organizer?.introduction ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 阻止瀏覽器原生送出，否則整頁會重新載入
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch("/api/organizer", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        // introduction 是選填，空字串就送 null ——
        // 存成空字串的話，前端的 {introduction && ...} 判斷會失效
        body: JSON.stringify({
          name,
          introduction: introduction.trim() || null,
        }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();
        setError(
          apiError.message ?? (isEdit ? "儲存失敗，請稍後再試" : "建立失敗，請稍後再試"),
        );
        return;
      }

      if (isEdit) {
        // 編輯留在原頁。refresh 讓 Server Component 重新取資料，
        // 免得使用者按下重整才看到自己剛改的名稱
        setSaved(true);
        router.refresh();
        return;
      }

      router.push("/organizer/events");
      // ⚠️ 一定要加 refresh：push 可能沿用「還不是主辦者」那次渲染的 RSC 快取，
      // 使用者會看到自己剛建好身分卻還是引導畫面
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-ink-soft">
          主辦單位名稱
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：蘭響音樂教室"
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="introduction"
          className="text-sm font-medium text-ink-soft"
        >
          單位介紹<span className="ml-1 text-ink-muted">（選填）</span>
        </label>
        <textarea
          id="introduction"
          name="introduction"
          rows={4}
          maxLength={1000}
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="會顯示在你的活動頁面上"
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-brand"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "儲存中…"
              : "建立中…"
            : isEdit
              ? "儲存變更"
              : "建立主辦者身分"}
        </button>
        {/* role="status"：成功訊息不像錯誤那麼急，用 polite 的宣告方式 */}
        {saved && !loading && (
          <p role="status" className="text-sm text-brand-teal">
            已儲存
          </p>
        )}
      </div>
    </form>
  );
}
