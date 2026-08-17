import { SectionTitle } from "@/components/SectionTitle";
import { CategoryNav } from "@/features/events/components/CategoryNav";
import { EventCard } from "@/features/events/components/EventCard";
import { Hero } from "@/features/home/components/Hero";
import { springGet } from "@/lib/spring";
import type {
  CategoryResponse,
  EventSummaryResponse,
  PagedModel,
} from "@/lib/api-types";

export default async function Home() {
  // 兩個請求互不相依，平行送出。
  // （搜尋頁不能這樣做 —— 那裡要先拿分類清單來驗證 ?category=）
  const [categories, page] = await Promise.all([
    springGet<CategoryResponse[]>("/api/categories", { revalidate: 3600 }),
    springGet<PagedModel<EventSummaryResponse>>("/api/events"),
  ]);

  return (
    <>
      <Hero />

      <main className="flex flex-1 flex-col gap-10 px-4 py-8 sm:px-8 lg:px-[76px] lg:py-10">
        <CategoryNav categories={categories} />

        <div className="flex flex-col gap-[25px]">
          <SectionTitle title="即將登場" />

          {page.content.length === 0 ? (
            <p className="py-20 text-center text-ink-muted">
              目前沒有即將開始的活動
            </p>
          ) : (
            <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {page.content.map((event) => (
                <li key={event.id} className="w-full max-w-[304px]">
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
