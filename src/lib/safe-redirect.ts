/**
 * 把使用者可控的 next 參數收斂成「保證是站內」的路徑。
 *
 * 直接拿 query 參數導向會造成 open redirect：攻擊者可以讓使用者
 * 在你的網站上完成登入，再把他送到長得一模一樣的釣魚頁 ——
 * 整個過程網址列都是可信的，直到最後一跳。
 *
 * 規則：必須以單一 / 開頭。
 * - "//evil.com"  會被瀏覽器當成協定相對的絕對網址 → 擋掉
 * - "/\evil.com"  部分瀏覽器會把反斜線正規化成 / → 擋掉
 */
export function safeNextPath(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
