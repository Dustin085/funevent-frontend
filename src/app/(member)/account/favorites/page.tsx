import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { SectionTitle } from "@/components/SectionTitle";
import { EventCard } from "@/features/events/components/EventCard";
import { SpringApiError, springGet } from "@/lib/spring";
import type { EventSummaryResponse, PagedModel } from "@/lib/api-types";

// robots noindex：要登入才有內容，爬蟲只會拿到空殼
export const metadata: Metadata = {
  title: "我的收藏",
  robots: { index: false },
};

const PAGE_SIZE = 12;

export default async function MyFavoritesPage({
  searchParams,
}: PageProps<"/account/favorites">) {
  const { page } = await searchParams;
  // 網址是 1 起算（給人看），API 是 0 起算
  const humanPage = Math.max(
    1,
    Number(Array.isArray(page) ? page[0] : page) || 1,
  );

  let favorites: PagedModel<EventSummaryResponse>;
  try {
    // ⭐ 後端回的就是 EventSummaryResponse，所以下面可以原封不動重用 EventCard
    favorites = await springGet<PagedModel<EventSummaryResponse>>(
      `/api/users/me/favorites?page=${humanPage - 1}&size=${PAGE_SIZE}`,
      { auth: true },
    );
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent("/account/favorites")}`);
    }
    throw error;
  }

  return (
    // ⚠️ 版面寬度與外距交給 (member)/layout.tsx —— 這裡只負責內容
    <main className="flex flex-col gap-6">
      <SectionTitle title="我的收藏" />

      {favorites.content.length === 0 ? (
        <div className="rounded-[10px] bg-white p-10 text-center funevent-shadow">
          <p className="text-ink-muted">還沒有收藏任何活動</p>
          <Link
            href="/search"
            className="mt-4 inline-block text-brand-teal hover:underline"
          >
            去看看有哪些活動
          </Link>
        </div>
      ) : (
        // ⚠️ 側邊欄佔掉左側，這裡最多兩欄（搜尋頁沒有側邊欄所以是三欄）
        <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2">
          {favorites.content.map((event) => (
            <li key={event.id} className="w-full max-w-[304px]">
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination 自己會在只有一頁時不渲染 */}
      <Pagination
        currentPage={humanPage}
        totalPages={Math.max(1, favorites.page.totalPages)}
        buildHref={(p) => `/account/favorites?page=${p}`}
      />
    </main>
  );
}
