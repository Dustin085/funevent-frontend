"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * @param className 讓呼叫端換樣式（Topbar 用膠囊造型，其他地方用預設外框）
 * @param children 讓呼叫端換內容（Topbar 要圖示 + 可隱藏的文字）
 */
export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
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
      {/* 呼叫端給了 children 就用它；沒給就維持原本的純文字行為。
          給 children 時的載入回饋靠 disabled 的 opacity，不再換字 ——
          否則手機上圖示會被文字取代，按鈕寬度會跳動 */}
      {children ?? (loading ? "登出中..." : "登出")}
    </button>
  );
}
