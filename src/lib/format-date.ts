/**
 * 後端的 Instant 是 UTC，但畫面要顯示台北時間。
 *
 * ⚠️ 不能用 new Date(iso).getHours() —— 那會依「執行環境」的時區而變。
 * Server Component 在伺服器上跑，正式環境多半是 UTC，
 * 那樣做會讓所有活動時間少 8 小時，而且在本機測試完全看不出來。
 */
const TAIPEI = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 2026.09.12(六) 10:00 */
export function formatEventDateTime(iso: string): string {
  const parts = Object.fromEntries(
    TAIPEI.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  const weekday = parts.weekday?.slice(-1) ?? ""; // 「週六」→「六」
  return `${parts.year}.${parts.month}.${parts.day}(${weekday}) ${parts.hour}:${parts.minute}`;
}
