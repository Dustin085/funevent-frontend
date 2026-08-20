"use client";

import { ApiError, MessageResponse } from "@/lib/api-types";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // 後端統一過錯誤格式，直接取 message 顯示
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "發送失敗，請稍後再試");
        return;
      }

      const data: MessageResponse = await res.json();
      setSuccessMessage(data.message);
    } catch {
      // fetch 本身失敗（斷網、Next server 掛掉）才會進到這裡
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  // 成功後不再顯示表單，改顯示後端回傳的訊息
  if (successMessage) {
    return (
      <p role="status" className="text-sm text-foreground">
        {successMessage}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          電子信箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
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
        className="rounded bg-brand hover:bg-brand-hover transition-colors px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "處理中..." : "寄送重設密碼信"}
      </button>
    </form>
  );
}
