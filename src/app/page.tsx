import { SectionTitle } from "@/components/SectionTitle";
import { EventCard } from "@/features/events/components/EventCard";
import { springGet } from "@/lib/spring";
import type { EventSummaryResponse, PagedModel } from "@/lib/api-types";

export default async function Home() {
  // 公開端點，不需要 token。Server Component 直接打 Spring，
  // 不必經過 route handler —— BFF 的「讀」側就是這裡。
  const page = await springGet<PagedModel<EventSummaryResponse>>("/api/events");

  return (
    // 內距隨螢幕縮放：手機 16px → 平板 32px → 桌機維持設計稿的 76px
    <main className="flex flex-1 flex-col gap-[25px] px-4 py-8 sm:px-8 lg:px-[76px] lg:py-10">
      <SectionTitle title="即將登場" />

      {page.content.length === 0 ? (
        <p className="py-20 text-center text-ink-muted">
          目前沒有即將開始的活動
        </p>
      ) : (
        // 明確指定各斷點的欄數，而不是 auto-fill ——
        // auto-fill 在「寬度剛好放不下第 N 欄」時會留下一大塊空白
        <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {page.content.map((event) => (
            <li key={event.id} className="w-full max-w-[304px]">
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
