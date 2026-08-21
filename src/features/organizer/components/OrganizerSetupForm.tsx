"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api-types";

/**
 * 建立主辦者身分。
 *
 * ⚠️ 只有兩個欄位，沿用 LoginForm 的手寫 useState 模式 ——
 * 不值得為它引入表單函式庫。活動表單（9 個欄位 + 可增刪的票種陣列）才需要。
 */
export function OrganizerSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 阻止瀏覽器原生送出，否則整頁會重新載入
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch("/api/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // introduction 是選填，空字串就送 null
        body: JSON.stringify({
          name,
          introduction: introduction.trim() || null,
        }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "建立失敗，請稍後再試");
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
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
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
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-brand px-4 py-2 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
      >
        {loading ? "建立中…" : "建立主辦者身分"}
      </button>
    </form>
  );
}
