/**
 * 頁面載入中的畫面。三顆品牌色圓點依序跳動，比轉圈更貼近活動趣的視覺語言。
 *
 * <p>⭐ 抽出來成為共用元件，是因為 <b>Suspense 邊界必須放在會變動的那一層</b>，
 * 一個根層級的 loading.tsx 沒辦法涵蓋所有跳轉 —— 詳見 src/app/loading.tsx 的說明。
 * 每個路由的 loading.tsx 都只是一行 re-export，實際長相只有這一份。
 *
 * <p>⚠️ 不會在 Client Component 自己 fetch 時觸發
 *（例如 TicketTypePicker 送出訂單）—— 那要自己管 loading 狀態。
 */
export function PageLoading() {
  return (
    <main className="flex flex-1 items-center justify-center py-32">
      <div className="flex flex-col items-center gap-5">
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
