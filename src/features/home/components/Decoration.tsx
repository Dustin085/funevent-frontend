/**
 * 首頁背景的裝飾色塊。
 *
 * 舊專案把八個色塊全部塞在頁面最上方當兄弟節點，用 position:absolute
 * 加寫死的 top（1913px / 2556px / 3031px）對齊到各個區塊旁邊。
 * 那只在「某個特定視窗寬度 + 某個特定內容量」下成立 ——
 * 我們多加了「特色主題」一整排，那些數字就全錯位了。
 *
 * 這裡改成：色塊放進它要陪襯的那個區塊內，用該區塊當定位基準。
 * 內容長高、少一排、換順序，色塊都跟著走。
 */
export function Decoration({
  src,
  className,
}: {
  /** 沒有 src 就是純色塊，顏色自己寫在 className */
  src?: string;
  className: string;
}) {
  return (
    <div
      aria-hidden
      // -z-10：沉到區塊內容之下。這個負值之所以安全，
      // 是因為外層一定要有 isolate（見 page.tsx）—— 否則它會逃到根層級去
      className={`pointer-events-none absolute -z-10 bg-contain bg-center bg-no-repeat ${className}`}
      // ⚠️ 用 inline style 而不是 bg-[url(...)]：
      // Tailwind 是靜態掃原始碼產生 class 的，變數拼出來的 class 它看不到
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    />
  );
}
