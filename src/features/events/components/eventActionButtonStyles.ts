/**
 * 舊專案的 `.funevent-btn-round`（圓角 99 按鈕）。
 *
 * ```css
 * .funevent-btn-round {
 *     display: flex; align-items: center;
 *     background-color: var(--primary-2);   // = brand-teal
 *     border-radius: 99px;
 *     padding: 8px 18px;
 *     color: var(--light); font-size: 20px; font-weight: 500;
 * }
 * ```
 *
 * ⚠️ 抽成常數而不是各自複製：收藏與轉發是並排的一對，
 * 樣式走鐘的話會很明顯。之後若有第三顆（例如「聯絡主辦」）也用同一份。
 */
export const roundButtonClass =
  "flex items-center gap-[3px] rounded-full bg-brand-teal px-[18px] py-2 " +
  "text-[20px] font-medium whitespace-nowrap text-white " +
  "transition-colors duration-[350ms] hover:bg-brand-teal-hover " +
  "disabled:opacity-60";

/**
 * `.funevent-btn-round__icon`：24×24。
 *
 * ⚠️ 間距用外層的 `gap-[3px]` 而不是這裡的 margin —— 手機版文字會被藏起來，
 * margin 會留下一段沒有意義的空白，flex gap 則在只有一個子元素時自動消失。
 */
export const roundButtonIconClass = "h-6 w-6 shrink-0";

/**
 * 手機只留圖示。同 Topbar 的 menuLabelClass ——
 * 375px 寬度下兩顆帶文字的按鈕會擠。
 *
 * ⚠️ 文字藏起來之後按鈕就沒有可見名稱了，所以每顆都必須自己補 aria-label。
 */
export const roundButtonLabelClass = "hidden sm:inline";
