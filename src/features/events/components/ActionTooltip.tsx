/**
 * 浮在按鈕上方的小提示。
 *
 * ⭐ 用絕對定位而不是在按鈕旁邊插一行字：那會把同一列的其他東西推開，
 * 訊息出現與消失時整個版面會跳兩次。
 *
 * ⭐ 也不用 toast：使用者剛按下按鈕，注意力就在這裡 ——
 * 跑到畫面角落反而容易錯過。toast 適合的是「發生在你沒看的地方」的事。
 *
 * ⚠️ 外層必須是 `relative`，否則會相對到更外面的定位祖先去。
 */
export function ActionTooltip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  /** error 用紅底 —— 失敗的訊息要跟成功的明顯不同 */
  tone?: "default" | "error";
}) {
  const background = tone === "error" ? "bg-red-600" : "bg-ink";

  return (
    <span
      role="status"
      // ⚠️ pointer-events-none：它蓋在按鈕上方，不能擋住第二次點擊
      className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-[6px] px-3 py-1 text-[14px] whitespace-nowrap text-white ${background}`}
    >
      {children}
      {/* 小三角。旋轉 45 度的方塊，一半露在氣泡外面 */}
      <span
        aria-hidden
        className={`absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 ${background}`}
      />
    </span>
  );
}
