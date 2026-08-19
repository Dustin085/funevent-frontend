/**
 * ⚠️ 必須是原生 <a>，不能用 next/link。
 *
 * <Link> 走的是客戶端路由 —— 它會把目標當成一個頁面去要 RSC payload，
 * 而這裡的目標是一支會回 302 到 accounts.google.com 的 Route Handler。
 * 離開本站需要的是「真正的瀏覽器導覽」。
 *
 * ⚠️ 沒有放 Google 的 G 標誌 —— 那是 Google 的品牌資產，有官方的使用規範
 * 與素材檔。要做成正式的「Sign in with Google」按鈕的話，
 * 素材要從 Google 的 branding 頁面下載。
 */
export function GoogleLoginButton({ next }: { next: string }) {
  return (
    <a
      href={`/api/auth/oauth/google?next=${encodeURIComponent(next)}`}
      className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 transition-colors duration-[350ms] hover:bg-gray-50"
    >
      使用 Google 帳號登入
    </a>
  );
}
