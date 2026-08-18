import { CategoryNav } from "@/features/events/components/CategoryNav";
import { EventSection } from "@/features/events/components/EventSection";
import { Hero } from "@/features/home/components/Hero";
import type { HeroSlide } from "@/features/home/components/HeroCarousel";
import { springGet } from "@/lib/spring";
import type {
  CategoryResponse,
  EventSummaryResponse,
  PagedModel,
} from "@/lib/api-types";

const HERO_SLIDE_COUNT = 5;
/** 每一排剛好是 xl 斷點的一行 */
const SECTION_SIZE = 4;

export default async function Home() {
  // 三個請求互不相依，平行送出。
  // （搜尋頁不能這樣做 —— 那裡要先拿分類清單來驗證 ?category=）
  const [categories, upcoming, newest] = await Promise.all([
    springGet<CategoryResponse[]>("/api/categories", { revalidate: 3600 }),
    springGet<PagedModel<EventSummaryResponse>>(
      `/api/events?size=${SECTION_SIZE}`,
    ),
    // ⚠️ 加 id 當第二排序鍵：createdAt 有並列值時，資料庫回傳的順序不保證穩定，
    // 分頁時同一筆可能出現在兩頁、或兩頁都漏掉。
    // id 是 IDENTITY 遞增的，同一毫秒內 id 大的就是後建立的 —— 語意剛好一致
    springGet<PagedModel<EventSummaryResponse>>(
      `/api/events?size=${SECTION_SIZE}&sort=createdAt,desc&sort=id,desc`,
    ),
  ]);

  // 只挑「有封面圖」的活動 —— 沒圖的活動放進首屏會是一整片漸層。
  // 用 flatMap 而不是 filter + map：filter 之後 TS 仍然認為 coverImageUrl 可能是 null，
  // 除非寫型別謂詞，否則後面就得用 !
  const heroSlides: HeroSlide[] = upcoming.content
    .flatMap((event) =>
      event.coverImageUrl
        ? [
            {
              imageUrl: event.coverImageUrl,
              href: `/events/${event.id}`,
              label: event.name,
            },
          ]
        : [],
    )
    .slice(0, HERO_SLIDE_COUNT);

  return (
    <>
      <Hero slides={heroSlides} />

      <main className="flex flex-1 flex-col gap-10 px-4 py-8 sm:px-8 lg:px-[76px] lg:py-10">
        <CategoryNav categories={categories} />

        <EventSection
          title="即將登場"
          moreHref="/search"
          events={upcoming.content}
          emptyText="目前沒有即將開始的活動"
        />

        <EventSection
          title="最新上架"
          moreHref="/search"
          events={newest.content}
          emptyText="目前沒有新上架的活動"
        />
      </main>
    </>
  );
}
