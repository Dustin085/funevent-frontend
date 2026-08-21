/**
 * 表單欄位的外框：label + 內容 + 錯誤訊息。
 *
 * 抽出來是因為活動表單有九個欄位，同樣的 markup 重複九次的話，
 * 之後要調整錯誤訊息的樣式或無障礙屬性得改九個地方。
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  /** 例如「（選填）」 */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
        {hint && (
          <span className="ml-1 font-normal text-ink-muted">{hint}</span>
        )}
      </label>
      {children}
      {/* role="alert"：錯誤是「剛剛發生的事」，螢幕閱讀器要主動唸出來，
          不能只靠紅色文字 */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** 表單控制項的共用樣式。錯誤時邊框變紅，不是只有底下多一行字 */
export function inputClass(hasError: boolean) {
  return `rounded border px-3 py-2 outline-none focus:border-gray-900 ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;
}
