import Image from "next/image";

/**
 * 關鍵字搜尋框。
 *
 * ⭐ 用原生的 <form action="/search">，不是 client component ——
 * 瀏覽器送出 GET 表單時會自動把欄位變成 query string，
 * 所以這個東西**完全不需要 JavaScript** 就能運作。
 *
 * ⚠️ 但 GET 表單只會送出「表單裡的欄位」。在搜尋頁上直接送出的話，
 * 目前的分類與地區篩選會整個消失 —— 所以要用 hidden 欄位把它們帶著走。
 */
export function SearchBox({
  defaultValue = "",
  preserve = [],
  className = "",
  inputClassName = "",
}: {
  defaultValue?: string;
  /**
   * 要一起帶走的其他篩選條件。
   * ⚠️ 用 [name, value] 的陣列而不是物件 —— 篩選是多選的，
   * 同一個 name 會出現好幾次（category=A、category=B），物件表達不了
   */
  preserve?: readonly (readonly [string, string])[];
  className?: string;
  inputClassName?: string;
}) {
  return (
    <form action="/search" className={`relative ${className}`}>
      {preserve.map(([name, value]) => (
        <input key={`${name}=${value}`} type="hidden" name={name} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="搜尋活動或主辦單位"
        aria-label="搜尋活動"
        className={inputClassName}
      />
      {/* 圖示本身就是送出鈕 —— 在輸入框按 Enter 也能送出 */}
      <button
        type="submit"
        aria-label="搜尋"
        className="absolute top-1/2 right-[14px] -translate-y-1/2"
      >
        <Image
          src="/images/search-icon-gray.svg"
          alt=""
          width={28}
          height={28}
          aria-hidden
        />
      </button>
    </form>
  );
}
