import type { CategoryResponse, CityResponse } from "@/lib/api-types";

/**
 * 搜尋頁的 query 參數處理。
 *
 * ⚠️ 抽出來是因為同一組條件要在四個地方組裝：打給 Spring 的網址、
 * 分頁連結、搜尋框的 hidden 欄位、清除連結。分開寫遲早會有一個漏掉某個條件，
 * 而症狀是「翻到第二頁篩選就不見了」這種很難察覺的 bug。
 */

/** searchParams 的值可能是 string、string[] 或 undefined，統一成陣列 */
export function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * 用已知清單當白名單過濾使用者輸入。
 *
 * ⚠️ 不能把使用者輸入直接往後端送 —— 後端對認不得的 enum 會回 400，
 * 而 Server Component 裡沒攔住的例外會變成整頁錯誤畫面。
 * 認不得的值當成沒篩選（跟 safeNextPath 同一個念頭）。
 */
export function pickKnownCodes(
  requested: string[],
  known: (CategoryResponse | CityResponse)[],
): string[] {
  const codes = new Set(known.map((item) => item.code));
  // 去重：?category=A&category=A 不該讓後端收到兩個一樣的值
  return [...new Set(requested.filter((code) => codes.has(code)))];
}

export interface SearchSelection {
  keyword: string;
  categories: string[];
  cities: string[];
}

/** 組出 /search 的網址。page 為 1 時省略，讓第一頁的網址乾淨 */
export function buildSearchHref(
  selection: SearchSelection,
  page: number = 1,
): string {
  const params = new URLSearchParams();
  if (selection.keyword) params.set("q", selection.keyword);
  // ⚠️ 多值要用 append 不是 set —— set 會覆蓋掉前一個
  selection.categories.forEach((code) => params.append("category", code));
  selection.cities.forEach((code) => params.append("city", code));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}
