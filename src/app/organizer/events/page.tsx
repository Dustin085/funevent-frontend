import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { EventStatusBadge } from "@/features/organizer/components/EventStatusBadge";
import { formatEventDateTime } from "@/lib/format-date";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { firstValue } from "@/lib/search-params";
import { springGet } from "@/lib/spring";
import type {
  EventStatusCode,
  OrganizerEventSummaryResponse,
  PagedModel,
} from "@/lib/api-types";

export const metadata: Metadata = {
  title: "主辦者後台",
  robots: { index: false },
};

const PAGE_SIZE = 20;

const STATUS_TABS: { code: EventStatusCode | null; label: string }[] = [
  { code: null, label: "全部" },
  { code: "DRAFT", label: "草稿" },
  { code: "PUBLISHED", label: "已發布" },
  { code: "CANCELLED", label: "已取消" },
];

export default async function MyEventsPage({
  searchParams,
}: PageProps<"/organizer/events">) {
  const { status, page } = await searchParams;
  const humanPage = Math.max(1, Number(firstValue(page)) || 1);

  // ⚠️ 三段式的入口判斷，順序不能顛倒：
  // 沒登入 → 先去登入；登入了但不是主辦者 → 顯示建立身分的引導
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/organizer/events")}`);
  }

  const organizer = await getCurrentOrganizer();
  if (!organizer) return <BecomeOrganizerPrompt />;

  // 認不得的 status 當成沒篩選（跟 safeNextPath 同一個念頭）
  const requested = firstValue(status);
  const activeStatus =
    STATUS_TABS.find((tab) => tab.code === requested)?.code ?? null;

  const query = new URLSearchParams({
    page: String(humanPage - 1),
    size: String(PAGE_SIZE),
  });
  if (activeStatus) query.set("status", activeStatus);

  const result = await springGet<PagedModel<OrganizerEventSummaryResponse>>(
    `/api/organizers/me/events?${query}`,
    { auth: true },
  );

  const tabHref = (code: EventStatusCode | null) =>
    code ? `/organizer/events?status=${code}` : "/organizer/events";

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-medium text-ink-soft sm:text-[28px]">
            主辦者後台
          </h1>
          {/* 單位名稱本身就是進入編輯的入口 —— 名稱與介紹會顯示在每個活動頁上，
              使用者會來這裡找它 */}
          <p className="mt-1 text-[16px] text-ink-muted">
            {organizer.name}
            <Link
              href="/organizer/profile"
              className="ml-3 text-[14px] text-brand-teal transition-colors duration-[350ms] hover:text-brand-teal-hover"
            >
              編輯單位資料
            </Link>
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="flex h-[42px] items-center rounded-[10px] bg-brand px-5 text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-hover"
        >
          ＋ 建立活動
        </Link>
      </div>

      {/* 三個選項而已，用連結不用下拉 —— 可以分享、上一頁也記得住 */}
      <nav aria-label="狀態篩選">
        <ul className="flex flex-wrap gap-4">
          {STATUS_TABS.map((tab) => {
            const active = tab.code === activeStatus;
            return (
              <li key={tab.label}>
                <Link
                  href={tabHref(tab.code)}
                  aria-current={active ? "page" : undefined}
                  className={`text-[16px] transition-colors duration-[350ms] hover:text-brand ${
                    active ? "font-bold text-brand" : "text-ink-soft"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {result.content.length === 0 ? (
        <div className="rounded-[10px] bg-white p-12 text-center funevent-shadow">
          <p className="text-ink-muted">
            {activeStatus ? "這個狀態下沒有活動" : "還沒有建立任何活動"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {result.content.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-4 rounded-[10px] bg-white p-4 funevent-shadow sm:flex-row sm:items-center"
            >
              {/* 沒有封面圖時用品牌色漸層佔位，版面不會塌 */}
              <div className="relative h-[90px] w-full shrink-0 overflow-hidden rounded-[8px] bg-linear-to-br from-brand-teal to-brand sm:w-[140px]">
                {/* ⚠️ 白名單外的網域會讓 next/image 拋錯，見 image-hosts.ts */}
                {isAllowedImageUrl(event.coverImageUrl) && (
                  <Image
                    src={event.coverImageUrl}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-[18px] font-medium text-ink-soft">
                    {event.name}
                  </h2>
                  <EventStatusBadge status={event.status} />
                </div>
                <p className="text-[14px] text-ink-muted">
                  {event.categoryName}・{formatEventDateTime(event.startAt)}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/organizer/events/${event.id}/orders`}
                  className="flex h-[38px] items-center rounded-[10px] border border-[#d9d9d9] px-4 text-[15px] text-ink-soft transition-colors duration-[350ms] hover:text-brand"
                >
                  訂單
                </Link>
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="flex h-[38px] items-center rounded-[10px] border border-[#d9d9d9] px-4 text-[15px] text-ink-soft transition-colors duration-[350ms] hover:text-brand"
                >
                  編輯
                </Link>
                {/* ⚠️ 「查看」只在已發布時出現 —— 草稿與已取消的公開頁面會 404，
                    放一個必定壞掉的連結比沒有更糟 */}
                {event.status === "PUBLISHED" && (
                  <Link
                    href={`/events/${event.id}`}
                    className="flex h-[38px] items-center rounded-[10px] bg-brand-teal px-4 text-[15px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover"
                  >
                    查看
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={humanPage}
        totalPages={Math.max(1, result.page.totalPages)}
        buildHref={(p) =>
          activeStatus
            ? `/organizer/events?status=${activeStatus}&page=${p}`
            : `/organizer/events?page=${p}`
        }
      />
    </main>
  );
}

/**
 * 登入了但還不是主辦者。
 *
 * ⚠️ 刻意用「渲染提示」而不是 redirect 到 /organizer/setup ——
 * redirect 的話使用者按上一頁會回到這裡，然後又被踢去 setup，
 * 上一頁等於失效。讓他自己決定要不要去。
 */
function BecomeOrganizerPrompt() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-[10px] bg-white p-10 text-center funevent-shadow">
        <h1 className="text-[22px] font-medium text-ink-soft">
          還沒有主辦者身分
        </h1>
        <p className="mt-3 text-[16px] leading-7 text-ink-muted">
          建立主辦者身分之後就可以開始舉辦活動、管理票種與訂單。
        </p>
        <Link
          href="/organizer/setup"
          className="mt-6 inline-flex h-[44px] items-center rounded-[10px] bg-brand px-6 text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-hover"
        >
          建立主辦者身分
        </Link>
      </div>
    </main>
  );
}
