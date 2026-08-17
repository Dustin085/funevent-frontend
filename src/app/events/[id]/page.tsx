import Image from "next/image";
import { notFound } from "next/navigation";
import { EventImageCarousel } from "@/features/events/components/EventImageCarousel";
import { TicketTypePicker } from "@/features/events/components/TicketTypePicker";
import type { TicketTypeOption } from "@/features/events/components/TicketTypePicker";
import { formatEventDateTime } from "@/lib/format-date";
import { SpringApiError, springGet } from "@/lib/spring";
import type { EventResponse, TicketTypeResponse } from "@/lib/api-types";
import { SectionTitle } from "@/components/SectionTitle";

export default async function EventDetailPage({
  params,
}: PageProps<"/events/[id]">) {
  const { id } = await params;

  let event: EventResponse;
  let ticketTypes: TicketTypeResponse[];
  try {
    // 兩個請求互不相依，平行送出。後端本來就是兩個端點：
    // 活動詳情是公開資料，票種是活動的子資源
    [event, ticketTypes] = await Promise.all([
      springGet<EventResponse>(`/api/events/${id}`),
      springGet<TicketTypeResponse[]>(`/api/events/${id}/ticket-types`),
    ]);
  } catch (error) {
    // 後端對「未發布」的活動也回 404（不洩漏存在性），這裡直接轉成 Next 的 404 頁
    if (error instanceof SpringApiError && error.status === 404) notFound();
    throw error;
  }

  // 可否購買在伺服器端算好再傳下去 —— 若在 Client Component 裡用 Date.now()，
  // 伺服器渲染與瀏覽器 hydration 的時間點不同，會產生 hydration mismatch
  const now = Date.now();
  const options: TicketTypeOption[] = ticketTypes.map((ticketType) => ({
    ...ticketType,
    unavailableReason: resolveUnavailableReason(ticketType, now),
  }));

  return (
    <main className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-x-[34px] gap-y-[25px] px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,475px)] lg:px-[76px]">
      {/* ⭐ 四個區塊都明確指定 col-start / row-start，不靠 grid 自動排列 ——
          EventImageCarousel 在沒有圖片時會回傳 null，
          靠自動排列的話其餘三塊會整個遞補錯位。
          通則：只要有子元素是條件式渲染的，就不要依賴自動排列。 */}

      {/* 左上：主視覺輪播 */}
      <div className="lg:col-start-1 lg:row-start-1">
        <EventImageCarousel images={event.imageUrls} alt={event.name} />
      </div>

      {/* 右上：活動資訊卡。justify-center 讓內容在被同列的輪播撐高時垂直置中
          （舊版 .event-intro-card 也是這樣） */}
      <section className="funevent-shadow flex flex-col justify-center rounded-[10px] bg-white px-[27px] py-8 lg:col-start-2 lg:row-start-1">
        <h1 className="mb-5 text-[28px] leading-tight font-medium text-ink-soft sm:text-[36px]">
          {event.name}
        </h1>

        <dl className="grid grid-cols-[auto_1fr] gap-x-[10px] gap-y-5">
          <InfoLabel icon="/images/date-icon.svg" text="日期：" />
          <dd className="text-ink-soft">
            {formatEventDateTime(event.startAt)}
            <span className="mx-1">～</span>
            {formatEventDateTime(event.endAt)}
          </dd>

          <InfoLabel icon="/images/address-icon.svg" text="活動地點：" />
          <dd className="text-ink-soft">
            <p>{event.locationName ?? "未提供"}</p>
            {event.address && (
              <p className="text-[16px] text-ink-muted">{event.address}</p>
            )}
          </dd>

          <InfoLabel icon="/images/founder-icon.svg" text="主辦單位：" />
          <dd className="text-ink-soft">
            <p>{event.organizer.name}</p>
            {event.organizer.introduction && (
              <p className="text-[16px] text-ink-muted">
                {event.organizer.introduction}
              </p>
            )}
          </dd>
        </dl>
      </section>

      {/* 左下：活動介紹 */}
      <section className="funevent-shadow flex flex-col gap-1.5 rounded-[10px] bg-white px-[27px] py-8 lg:col-start-1 lg:row-start-2">
        {/* <h2 className="mb-4 text-[24px] font-medium text-ink-soft">活動介紹</h2> */}
        <SectionTitle title="活動介紹" />
        {/* description 是純文字（後端是 TEXT，沒有富文本編輯器），
            用 whitespace-pre-line 保留使用者輸入的換行 */}
        <p className="leading-8 whitespace-pre-line text-ink-soft">
          {event.description}
        </p>
      </section>

      {/* 右下：方案板。舊版用 jQuery 監聽 scroll 手動算 top，
          現在用原生 position: sticky，零 JavaScript。
          ⚠️ lg:self-start 不能少：grid 項目預設 stretch，會被拉到整列高，
          sticky 就沒有可滑動的空間、看起來完全沒作用（而且不會報錯） */}
      <aside className="lg:col-start-2 lg:row-start-2 lg:sticky lg:top-6 lg:self-start">
        <TicketTypePicker eventId={event.id} options={options} />
      </aside>
    </main>
  );
}

function InfoLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <dt className="flex items-center gap-2 text-[20px] font-medium text-ink-soft">
      <Image src={icon} alt="" width={20} height={20} aria-hidden />
      {text}
    </dt>
  );
}

/** 回傳不可購買的原因，可購買時回 null。規則與後端 validatePurchasable 對齊 */
function resolveUnavailableReason(
  ticketType: TicketTypeResponse,
  now: number,
): string | null {
  if (ticketType.stock <= 0) return "已售完";
  if (ticketType.saleStartAt && now < Date.parse(ticketType.saleStartAt)) {
    return "尚未開賣";
  }
  if (ticketType.saleEndAt && now > Date.parse(ticketType.saleEndAt)) {
    return "已停售";
  }
  return null;
}
