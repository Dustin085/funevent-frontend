import Image from "next/image";
import Link from "next/link";
import { formatEventDateTime } from "@/lib/format-date";
import type { EventSummaryResponse } from "@/lib/api-types";

/**
 * 從舊專案 web/assets/js/FuneventEventCard.jsx 移植。
 *
 * 保留的：304px 寬、白底圓角、hover 放大、圖片右下角的日期膠囊、兩行截斷的標題。
 *
 * 移除的（後端還沒有這些資料，刻意不放假資料 —— 假的星等與標籤
 * 會讓人忘記那些功能其實還沒做）：
 * - 收藏按鈕、最新／熱門標籤、tag 列、評分
 * - 原本 category 的位置改放主辦單位名稱（視覺權重相同）
 * - 主視覺圖改用品牌色漸層佔位，event_images 尚未實作
 *
 * 「我要報名」從 <button> + location.href 改成 <Link>：
 * 真正的導航，沒有 JS 也能用，而且 Next 會預抓取。
 */
export function EventCard({ event }: { event: EventSummaryResponse }) {
  const href = `/events/${event.id}`;

  return (
    <article className="group flex h-[380px] w-full max-w-[304px] flex-col gap-[11px] rounded-[10px] bg-white px-[14px] py-[17px] transition-transform duration-[350ms] hover:-translate-y-[2%] hover:scale-105">
      <Link
        href={href}
        className="relative flex h-[194px] w-full flex-col justify-end overflow-hidden rounded-[10px] bg-linear-to-br from-brand-teal to-brand shadow-[inset_0_0_10px_0_rgba(0,0,0,0.5)] transition-transform duration-[350ms] group-hover:scale-[1.02]"
      >
        <p className="self-end rounded-tl-[10px] bg-white px-[15px] pt-[5px] pb-[2px] text-[14px] text-ink-soft">
          {formatEventDateTime(event.startAt)}
        </p>
      </Link>

      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-bold text-brand-amber">
          {event.organizerName}
        </p>
        <h2 className="line-clamp-2 text-[18px] leading-[28px] font-bold text-ink-title sm:text-[20px] sm:leading-[30px]">
          <Link
            href={href}
            className="transition-colors duration-[350ms] hover:text-ink-soft"
          >
            {event.name}
          </Link>
        </h2>
        {event.locationName && (
          <div className="flex items-center gap-[6px]">
            <Image
              src="/images/map-pin-icon.svg"
              alt=""
              width={13}
              height={13}
              aria-hidden
            />
            {/* truncate：場地名稱可能很長，沒有它會把卡片撐開 */}
            <p className="truncate text-[14px] text-ink-muted">
              {event.locationName}
            </p>
          </div>
        )}
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
