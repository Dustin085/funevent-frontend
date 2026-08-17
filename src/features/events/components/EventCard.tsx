import Image from "next/image";
import Link from "next/link";
import { formatEventDateTime } from "@/lib/format-date";
import type { EventSummaryResponse } from "@/lib/api-types";

/**
 * 從舊專案 web/assets/js/FuneventEventCard.jsx 移植。
 *
 * 保留的：304px 寬、白底圓角、hover 放大、圖片右下角的日期膠囊、
 * 兩行截斷的標題、標題上方的彩色分類文字。
 *
 * 移除的（後端沒有這些資料，刻意不放假資料 ——
 * 假的星等與標籤會讓人忘記那些功能其實還沒做）：
 * - 收藏按鈕、最新／熱門標籤、tag 列、評分
 *
 * 「我要報名」從 <button> + location.href 改成 <Link>：
 * 真正的導航，沒有 JS 也能用，而且 Next 會預抓取。
 */
export function EventCard({ event }: { event: EventSummaryResponse }) {
  const href = `/events/${event.id}`;

  return (
    <article className="group flex h-[400px] w-full max-w-[304px] flex-col gap-[11px] rounded-[10px] bg-white px-[14px] py-[17px] transition-transform duration-[350ms] hover:-translate-y-[2%] hover:scale-105 funevent-shadow">
      {/* 底色的漸層在沒有圖片時就是佔位，有圖時被蓋住 */}
      <Link
        href={href}
        className="relative flex h-[194px] w-full flex-col justify-end overflow-hidden rounded-[10px] bg-linear-to-br from-brand-teal to-brand shadow-[inset_0_0_10px_0_rgba(0,0,0,0.5)] transition-transform duration-[350ms] group-hover:scale-[1.02]"
      >
        {event.coverImageUrl && (
          <Image
            src={event.coverImageUrl}
            alt=""
            fill
            // 卡片最寬 304px，告訴 Next 不必產生更大的尺寸
            sizes="304px"
            className="object-cover"
          />
        )}
        {/* relative + z-10：讓日期膠囊蓋在 fill 的圖片上方 */}
        <p className="relative z-10 self-end rounded-tl-[10px] bg-white px-[15px] pt-[5px] pb-[2px] text-[14px] text-ink-soft">
          {formatEventDateTime(event.startAt)}
        </p>
      </Link>

      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-bold text-brand-amber">
          {event.categoryName}
        </p>
        <h2 className="line-clamp-2 text-[18px] leading-[28px] font-bold text-ink-title sm:text-[20px] sm:leading-[30px]">
          <Link
            href={href}
            className="transition-colors duration-[350ms] hover:text-ink-soft"
          >
            {event.name}
          </Link>
        </h2>
        <div className="flex items-center gap-[6px]">
          <Image
            src="/images/map-pin-icon.svg"
            alt=""
            width={13}
            height={13}
            aria-hidden
          />
          {/* truncate：地區文字可能較長，沒有它會把卡片撐開 */}
          <p className="truncate text-[14px] text-ink-muted">
            {event.city}
            {event.district && ` · ${event.district}`}
          </p>
        </div>

        {/* ⚠️ TODO：票價與剩餘張數目前是寫死的，只為了確認版面。
            要變成真資料，EventSummaryResponse 需要加 minPrice 與 remainingStock
            （對 ticket_types 做 min(price) / sum(stock) 的聚合查詢，
            注意別做成 1+N）。在那之前，這兩個數字不代表任何東西。 */}
        <div className="flex items-baseline justify-between">
          <p className="text-[16px] font-bold text-brand-teal">NT$ 690 起</p>
          <p className="text-[14px] text-ink-muted">剩 32 張</p>
        </div>
      </div>

      {/* mt-auto 把按鈕推到底部，讓標題長度不影響按鈕位置 */}
      <Link
        href={href}
        className="mt-auto flex h-[41px] items-center justify-center rounded-[10px] bg-brand-teal text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover"
      >
        我要報名
      </Link>
    </article>
  );
}
