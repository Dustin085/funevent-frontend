import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { SectionTitle } from "@/components/SectionTitle";
import { CommentText } from "@/features/events/components/CommentText";
import { Stars } from "@/features/events/components/Stars";
import { formatEventDateTime } from "@/lib/format-date";
import { SpringApiError, springGet } from "@/lib/spring";
import type { MyCommentResponse, PagedModel } from "@/lib/api-types";

// robots noindex：要登入才有內容，爬蟲只會拿到空殼
export const metadata: Metadata = {
  title: "我的評論",
  robots: { index: false },
};

const PAGE_SIZE = 10;

export default async function MyCommentsPage({
  searchParams,
}: PageProps<"/account/comments">) {
  const { page } = await searchParams;
  // 網址是 1 起算（給人看），API 是 0 起算
  const humanPage = Math.max(
    1,
    Number(Array.isArray(page) ? page[0] : page) || 1,
  );

  let comments: PagedModel<MyCommentResponse>;
  try {
    comments = await springGet<PagedModel<MyCommentResponse>>(
      `/api/users/me/comments?page=${humanPage - 1}&size=${PAGE_SIZE}`,
      { auth: true },
    );
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent("/account/comments")}`);
    }
    throw error;
  }

  return (
    // 版面寬度與外距交給 (member)/layout.tsx
    <main className="flex flex-col gap-6">
      <SectionTitle title="我的評論" />

      {comments.content.length === 0 ? (
        <div className="rounded-[10px] bg-white p-10 text-center funevent-shadow">
          <p className="text-ink-muted">還沒有寫過評論</p>
          {/* ⚠️ 只有「參加過而且活動已開始」的人能評論，所以這裡不引導去某個
              特定活動 —— 引導去看看有什麼活動比較誠實 */}
          <Link
            href="/orders"
            className="mt-4 inline-block text-brand-teal hover:underline"
          >
            看看參加過的活動
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.content.map((comment) => (
            <li
              key={comment.id}
              className="flex flex-col gap-3 rounded-[10px] bg-white p-6 funevent-shadow"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {/* ⚠️ 活動可能已經下架或取消，這個連結會 404。
                    仍然放連結 —— 絕大多數情況活動都還在，
                    為了少數情況把所有人的入口拿掉不划算 */}
                <Link
                  href={`/events/${comment.eventId}`}
                  className="text-[18px] font-medium text-ink-soft transition-colors duration-[350ms] hover:text-brand"
                >
                  {comment.eventName}
                </Link>
                <p className="text-[14px] text-ink-muted">
                  {formatEventDateTime(comment.createdAt)}
                </p>
              </div>

              <Stars score={comment.rating} size={20} gap={4} />

              {/* 內容可為 null —— 只給星等不寫字是合理的評價方式 */}
              {comment.content && <CommentText text={comment.content} />}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination 自己會在只有一頁時不渲染 */}
      <Pagination
        currentPage={humanPage}
        totalPages={Math.max(1, comments.page.totalPages)}
        buildHref={(p) => `/account/comments?page=${p}`}
      />
    </main>
  );
}
