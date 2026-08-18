import Link from "next/link";

/**
 * notFound() 被呼叫，或網址對不到任何路由時顯示。
 *
 * 這個專案有三處會走到這裡：
 * - /events/[id] —— 活動不存在「或未發布」
 * - /orders/[id] —— 訂單不存在「或不是你的」
 * - 亂打的網址
 *
 * ⚠️ 文案要顧到「不是你的」那種情況：後端刻意用 404 而不是 403，
 * 就是為了不洩漏「這個 id 存在」。所以這裡不能寫「你沒有權限查看」——
 * 那等於把 403 的資訊講出來了。
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-32">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-5 text-center">
        <p className="text-[72px] leading-none font-bold text-brand">404</p>
        <h1 className="text-[24px] font-medium text-ink-soft">
          找不到這個頁面
        </h1>
        <p className="text-ink-muted">
          它可能已經下架、還沒公開，或是網址打錯了。
        </p>

        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-[10px] bg-brand px-6 py-3 text-white transition-colors duration-[350ms] hover:bg-brand-hover"
          >
            回首頁
          </Link>
          <Link
            href="/search"
            className="rounded-[10px] border-2 border-brand-teal px-6 py-3 text-brand-teal transition-colors duration-[350ms] hover:bg-brand-teal hover:text-white"
          >
            看看有哪些活動
          </Link>
        </div>
      </div>
    </main>
  );
}
