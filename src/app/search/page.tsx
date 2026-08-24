import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import { EventCard } from "@/features/events/components/EventCard";
import { SearchFilterBoard } from "@/features/events/components/SearchFilterBoard";
import {
  buildSearchHref,
  firstValue,
  pickKnownCodes,
  toArray,
} from "@/lib/search-params";
import { springGet } from "@/lib/spring";
import type {
  CategoryResponse,
  CityResponse,
  EventSummaryResponse,
  PagedModel,
} from "@/lib/api-types";

const PAGE_SIZE = 12;

/**
 * 從舊專案 search.html 移植：左側多選篩選欄 + 右側結果區。
 *
 * ⭐ 整頁的搜尋與篩選都是原生 GET 表單與連結 —— 關掉 JavaScript 也能用。
 * 價格區間與排序還需要後端支援（minPrice 聚合、Pageable 的 sort 參數）。
 */
/**
 * 標題帶關鍵字。⚠️ 分類與地區不放進標題 ——
 * 那需要多打 API 拿顯示名稱，而標題的價值主要來自關鍵字。
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const keyword = firstValue(q).trim();
  return { title: keyword ? `「${keyword}」的搜尋結果` : "搜尋活動" };
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q, category, city, page } = await searchParams;

  const keyword = firstValue(q).trim();
  const humanPage = Math.max(1, Number(firstValue(page)) || 1);

  // 兩份清單同時是篩選選單的資料來源，也是驗證 query 參數的白名單。
  // 內容永遠不變（都是 enum），快取一小時
  const [categories, cities] = await Promise.all([
    springGet<CategoryResponse[]>("/api/categories", { revalidate: 3600 }),
    springGet<CityResponse[]>("/api/cities", { revalidate: 3600 }),
  ]);

  const selection = {
    keyword,
    categories: pickKnownCodes(toArray(category), categories),
    cities: pickKnownCodes(toArray(city), cities),
  };

  // ⚠️ keyword 不需要白名單 —— 它是自由文字，後端用參數化查詢處理，沒有注入風險
  const query = new URLSearchParams({
    page: String(humanPage - 1),
    size: String(PAGE_SIZE),
  });
  if (keyword) query.set("q", keyword);
  selection.categories.forEach((code) => query.append("category", code));
  selection.cities.forEach((code) => query.append("city", code));

  const result = await springGet<PagedModel<EventSummaryResponse>>(
    `/api/events?${query}`,
  );

  const nameOf = (list: (CategoryResponse | CityResponse)[], codes: string[]) =>
    codes
      .map((code) => list.find((item) => item.code === code)?.name)
      .filter(Boolean) as string[];

  // 標題描述目前的條件。都沒有就是「全部活動」
  const conditions = [
    ...(keyword ? [`「${keyword}」`] : []),
    ...nameOf(categories, selection.categories),
    ...nameOf(cities, selection.cities),
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-8 lg:px-[76px]">
      <h1 className="text-[24px] font-medium text-ink-soft sm:text-[28px]">
        搜尋結果：
        <span className="text-brand">
          {conditions.length > 0 ? conditions.join("・") : "全部活動"}
        </span>
      </h1>

      {/* 搜尋頁上的搜尋框要把現有篩選帶著走，否則送出後篩選會消失。
          多值要展開成重複的 hidden 欄位 */}
      <SearchBox
        defaultValue={keyword}
        preserve={[
          ...selection.categories.map((code) => ["category", code] as const),
          ...selection.cities.map((code) => ["city", code] as const),
        ]}
        className="w-full max-w-[600px]"
        inputClassName="h-[52px] w-full rounded-full border-2 border-brand-amber bg-white px-6 pr-14 text-[18px] text-ink-title outline-none focus:border-brand-hover"
      />

      <div className="flex flex-col gap-[30px] lg:flex-row">
        <SearchFilterBoard
          categories={categories}
          cities={cities}
          activeCategories={selection.categories}
          activeCities={selection.cities}
          keyword={keyword}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex h-[70px] items-center rounded-[10px] bg-white px-5 funevent-shadow">
            {/* 排序下拉需要 Pageable 的 sort 參數，之後再做 */}
            <p className="text-[20px] font-medium text-ink-title">
              找到 {result.page.totalElements} 項結果
            </p>
          </div>

          {result.content.length === 0 ? (
            <p className="py-20 text-center text-ink-muted">
              {conditions.length > 0
                ? `找不到符合${conditions.join("・")}的活動`
                : "目前沒有即將開始的活動"}
            </p>
          ) : (
            <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.content.map((event) => (
                <li key={event.id} className="w-full max-w-[304px]">
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}

          {/* 換頁要保留全部篩選條件，否則翻到第二頁就變成搜尋全部活動 */}
          <Pagination
            currentPage={humanPage}
            totalPages={Math.max(1, result.page.totalPages)}
            buildHref={(p) => buildSearchHref(selection, p)}
          />
        </div>
      </div>
    </main>
  );
}
