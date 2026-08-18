"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * React 錯誤邊界。攔截該區段渲染時拋出的例外 ——
 * 最常見的是後端沒開：springGet 的 fetch 直接拋 TypeError，
 * 那不是 SpringApiError，所以會一路往上。
 *
 * ⚠️ 必須是 Client Component：錯誤邊界需要類別元件的生命週期。
 * ⚠️ 攔不到同層 layout.tsx 的錯誤 —— 那是 global-error.tsx 的工作。
 * ⚠️ 攔不到 notFound() —— 那是 not-found.tsx 的工作。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 正式環境的 error.message 會被 Next 洗成通用字串（避免洩漏伺服器細節），
    // 只有 digest 能對到伺服器日誌。開發環境則看得到完整訊息
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-32">
      <div className="funevent-shadow flex w-full max-w-[480px] flex-col items-center gap-5 rounded-[10px] bg-white px-8 py-10 text-center">
        <h1 className="text-[24px] font-medium text-ink-soft">
          頁面載入時發生問題
        </h1>
        {/* 不顯示 error.message —— 正式環境它是通用字串，開發環境又可能含內部細節。
            使用者需要的是「現在能做什麼」，不是技術訊息 */}
        <p className="text-ink-muted">
          可能是暫時的連線問題，稍後再試一次應該就好了。
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-[10px] bg-brand px-6 py-3 text-white transition-colors duration-[350ms] hover:bg-brand-hover"
          >
            重新載入
          </button>
          <Link
            href="/"
            className="rounded-[10px] border-2 border-brand px-6 py-3 text-brand transition-colors duration-[350ms] hover:bg-brand hover:text-white"
          >
            回首頁
          </Link>
        </div>

        {/* 讓使用者回報問題時有東西可以講 */}
        {error.digest && (
          <p className="text-[12px] text-ink-muted">錯誤代碼：{error.digest}</p>
        )}
      </div>
    </main>
  );
}
