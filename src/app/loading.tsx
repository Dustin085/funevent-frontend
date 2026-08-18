/**
 * Next 自動把同層的 page.tsx 包進 <Suspense fallback={<Loading/>}>，
 * Server Component 還在等資料時顯示。
 *
 * 放在根層級就涵蓋所有頁面 —— 找不到同層的話 Next 會往上找。
 * 之後若某頁想要「骨架屏」（skeleton），再在該路由加自己的 loading.tsx。
 *
 * ⚠️ 不會在 Client Component 自己 fetch 時觸發
 *（例如 TicketTypePicker 送出訂單）—— 那要自己管 loading 狀態。
 */
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center py-32">
      <div className="flex flex-col items-center gap-5">
        {/* 三顆品牌色圓點依序跳動，比轉圈更貼近活動趣的視覺語言 */}
        <div className="flex gap-2">
          <Dot className="bg-brand" delay={0} />
          <Dot className="bg-brand-teal" delay={150} />
          <Dot className="bg-brand-amber" delay={300} />
        </div>
        <p className="text-[16px] text-ink-muted">載入中…</p>
      </div>
    </main>
  );
}

function Dot({ className, delay }: { className: string; delay: number }) {
  return (
    <span
      // motion-reduce：跟輪播一樣尊重系統的「減少動態效果」設定
      className={`h-3 w-3 animate-bounce rounded-full motion-reduce:animate-none ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
