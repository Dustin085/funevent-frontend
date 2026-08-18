/**
 * 活動詳情頁的區塊 id 與導覽列項目。
 *
 * ⚠️ 這些常數必須放在「沒有 "use client" 的檔案」裡。
 *
 * 原本放在 EventInnerNav.tsx（"use client"）中，Server Component
 * import 進來拿到的不是這個物件，而是 React 的 client reference 代理 ——
 * 讀 .description 得到 undefined，<section id={undefined}> 就不輸出 id 屬性。
 * 導覽列自己在 client 模組內部讀到的是真值，所以 href 正常，
 * 結果是連結全部指向不存在的 id，而且不會有任何錯誤訊息。
 *
 * 通則：Server 與 Client 都要用到的純資料，放在兩邊都能安全 import 的中性模組。
 */
export const EVENT_SECTION_IDS = {
  overview: "event-overview",
  description: "event-description",
  plans: "event-plans",
  notice: "event-notice",
  organizer: "event-organizer",
  comments: "event-comments",
} as const;

/**
 * 點導覽列跳過去時，區塊上緣會停在距離視窗頂端這麼遠的位置。
 *
 * ⚠️ 這一個數字同時是兩件事，兩邊都從這裡取，不可以各寫各的：
 *   1. 各區塊的 scroll-margin-top（決定跳過去之後停在哪）
 *   2. 導覽列判斷「目前在哪一節」的掃描線（決定哪個分頁亮）
 * 兩者不一致的話，點了會亮上一個 —— 而且不會有任何錯誤。
 *
 * 值要大於黏住的導覽列高度（py-14 × 2 + 文字 ≈ 58px），留一點餘裕。
 */
export const SECTION_ANCHOR_OFFSET = 80;

export const EVENT_NAV_ITEMS = [
  { id: EVENT_SECTION_IDS.overview, label: "活動主頁" },
  { id: EVENT_SECTION_IDS.description, label: "活動介紹" },
  { id: EVENT_SECTION_IDS.plans, label: "選擇方案" },
  { id: EVENT_SECTION_IDS.notice, label: "注意事項" },
  { id: EVENT_SECTION_IDS.organizer, label: "主辦單位" },
  { id: EVENT_SECTION_IDS.comments, label: "活動評論" },
];
