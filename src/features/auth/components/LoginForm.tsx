"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api-types";

export function LoginForm({ next = "/" }: { next?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 阻止瀏覽器原生送出，否則整頁會重新載入
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // 後端統一過錯誤格式，直接取 message 顯示
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "登入失敗，請稍後再試");
        return;
      }

      // 登入成功。cookie 已由 route handler 寫入，這裡拿不到也不需要 token。
      // next 已在 Server Component 用 safeNextPath 驗過是站內路徑，可以直接用
      router.push(next);
      // ⚠ 一定要加 refresh：push 可能沿用登入前渲染的 RSC 快取，
      // 那份快取沒有 cookie，會顯示成未登入狀態
      router.refresh();
    } catch {
      // fetch 本身失敗（斷網、Next server 掛掉）才會進到這裡
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
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

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          密碼
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
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
        className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "登入中..." : "登入"}
      </button>
    </form>
  );
}