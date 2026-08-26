import { CategoryNav } from "@/features/events/components/CategoryNav";
import { EventSection } from "@/features/events/components/EventSection";
import { Decoration } from "@/components/Decoration";
import { Hero } from "@/features/home/components/Hero";
import type { HeroSlide } from "@/features/home/components/HeroCarousel";
import { TopicSection } from "@/features/home/components/TopicSection";
import { isAllowedImageUrl } from "@/lib/image-hosts";
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
      // ⚠️ isAllowedImageUrl 而不是只判斷有沒有值 —— 見 image-hosts.ts
      isAllowedImageUrl(event.coverImageUrl)
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

      {/* ⚠️ overflow-x-clip 不能寫成 overflow-x-hidden：
          hidden 會把另一軸從 visible 變成 auto，等於做出一個捲動容器，
          裝飾就再也不能垂直溢出到相鄰區塊了（而且會影響 sticky）。
          clip 不會建立捲動容器，只是切掉 —— 正是我們要的 */}
      <main className="flex flex-1 flex-col gap-10 overflow-x-clip px-4 py-8 sm:px-8 lg:px-[76px] lg:py-10">
        {/* relative 當定位基準，isolate 把 -z-10 關在這一格裡 */}
        <div className="relative isolate">
          <CategoryNav categories={categories} />
        </div>

        <div className="relative isolate">
          <Decoration
            src="/images/home-page-bg-color-block-small3.svg"
            className="-bottom-[10vw] -left-[22.98vw] h-[42.15vw] w-[42.15vw]"
          />
          <EventSection
            title="即將登場"
            moreHref="/search"
            events={upcoming.content}
            emptyText="目前沒有即將開始的活動"
          />
        </div>

        <div className="relative isolate">
          <Decoration
            src="/images/home-page-bg-color-block-small4.svg"
            className="-top-[8vw] -right-[25.06vw] h-[40.4vw] w-[40.4vw]"
          />
          <TopicSection />
        </div>

        <div className="relative isolate">
          {/* 這一顆舊版沒有 SVG，本來就是純 CSS 圓 */}
          <Decoration className="-bottom-[6vw] -left-[15.69vw] h-[19.51vw] w-[19.51vw] rounded-full bg-[rgba(255,227,187,0.5)]" />
          <Decoration
            src="/images/home-page-bg-color-block-small6.svg"
            className="-right-[29.58vw] -bottom-[12vw] h-[31.25vw] w-[37.22vw]"
          />
          <EventSection
            title="最新上架"
            moreHref="/search"
            events={newest.content}
            emptyText="目前沒有新上架的活動"
          />
        </div>
      </main>
    </>
  );
}
