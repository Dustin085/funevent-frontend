"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * @param className 讓呼叫端換樣式（Topbar 用膠囊造型，其他地方用預設外框）
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      // cookie 沒了，Server Component 重新渲染時 getCurrentUser() 會回傳 null
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ??
        "rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
      }
    >
      {loading ? "登出中..." : "登出"}
    </button>
  );
}
