import { Pagination } from "@/components/Pagination";
import { CategoryFilterBoard } from "@/features/events/components/CategoryFilterBoard";
import { EventCard } from "@/features/events/components/EventCard";
import { springGet } from "@/lib/spring";
import type {
  CategoryResponse,
  EventSummaryResponse,
  PagedModel,
} from "@/lib/api-types";

const PAGE_SIZE = 12;

/**
 * 從舊專案 search.html 移植：左側篩選欄 + 右側結果區。
 *
 * 今天只做「活動分類」篩選 —— 地區與價格需要後端支援 ?city= 與價格區間，
 * 而兩個篩選條件會讓衍生查詢變成組合爆炸（該換 Specification 的時機）。
 */
export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { category, page } = await searchParams;
  const requested = Array.isArray(category) ? category[0] : category;
  const humanPage = Math.max(
    1,
    Number(Array.isArray(page) ? page[0] : page) || 1,
  );

  // 分類清單同時是側邊欄的資料來源，也是驗證 ?category= 的白名單。
  // 內容永遠不變，快取一小時
  const categories = await springGet<CategoryResponse[]>("/api/categories", {
    revalidate: 3600,
  });

  // ⚠️ 不能把使用者輸入直接往後端送 —— 後端會回 400，
  // 而 Server Component 裡沒攔住的例外會變成整頁錯誤畫面。
  // 用已知清單當白名單，認不得的值當成沒篩選（跟 safeNextPath 同一個念頭）
  const activeCode = categories.find((c) => c.code === requested)?.code ?? null;
  const activeName = categories.find((c) => c.code === activeCode)?.name;

  const query = new URLSearchParams({
    page: String(humanPage - 1),
    size: String(PAGE_SIZE),
  });
  if (activeCode) query.set("category", activeCode);

  const result = await springGet<PagedModel<EventSummaryResponse>>(
    `/api/events?${query}`,
  );

  const buildHref = (p: number) =>
    activeCode
      ? `/search?category=${activeCode}&page=${p}`
      : `/search?page=${p}`;

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-8 lg:px-[76px]">
      <h1 className="text-[24px] font-medium text-ink-soft sm:text-[28px]">
        搜尋結果：
        <span className="text-brand">{activeName ?? "全部活動"}</span>
      </h1>

      <div className="flex flex-col gap-[30px] lg:flex-row">
        <CategoryFilterBoard categories={categories} activeCode={activeCode} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex h-[70px] items-center rounded-[10px] bg-white px-5 shadow-[0_0_2px_1px_rgba(0,0,0,0.3)]">
            {/* 排序下拉需要 client component 做導頁 + Pageable 的 sort 參數，之後再做 */}
            <p className="text-[20px] font-medium text-ink-title">
              找到 {result.page.totalElements} 項結果
            </p>
          </div>

          {result.content.length === 0 ? (
            <p className="py-20 text-center text-ink-muted">
              {activeName
                ? `「${activeName}」目前沒有即將開始的活動`
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

          <Pagination
            currentPage={humanPage}
            totalPages={Math.max(1, result.page.totalPages)}
            buildHref={buildHref}
          />
        </div>
      </div>
    </main>
  );
}
