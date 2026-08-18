import Image from "next/image";
import { notFound } from "next/navigation";
import { EventImageCarousel } from "@/features/events/components/EventImageCarousel";
import { TicketTypePicker } from "@/features/events/components/TicketTypePicker";
import type { TicketTypeOption } from "@/features/events/components/TicketTypePicker";
import { formatEventDateTime } from "@/lib/format-date";
import { SpringApiError, springGet } from "@/lib/spring";
import type { EventResponse, TicketTypeResponse } from "@/lib/api-types";
import { SectionTitle } from "@/components/SectionTitle";
import { Decoration } from "@/components/Decoration";

/**
 * ⚠️ 評分與標籤都是寫死的裝飾資料，只為了確認版面 ——
 * 這兩個數字與文字不代表任何東西。
 *
 * 要變成真的分別需要：
 * - 評分：一整套評論系統（comments 表、訂單完成才能評、avg + count 聚合且不能做成 1+N、
 *   一張訂單只能評一次的約束）
 * - 標籤：events 與 tags 的多對多，以及主辦者建立活動時的標籤輸入介面
 */
const PLACEHOLDER_RATING = { score: 4.9, count: 115 };
const PLACEHOLDER_TAGS = ["新手友善", "親子同樂", "室內活動"];

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
    // ⚠️ 這層 wrapper 不能省，也不能把色塊塞進 <main>：
    // main 有 mx-auto max-w-[1280px]，寬螢幕上左右各留了空白，
    // -right-[11.6vw] 會停在畫面內側，變成浮在旁邊的橢圓而不是切出畫面。
    // 這層是滿版的，色塊才會真的溢出視窗再被切掉。
    //
    // overflow-x-clip 而非 hidden：這一頁的方案板是 sticky，
    // hidden 會做出捲動容器讓 sticky 改貼著它 —— 那會直接失效。
    // clip 不建立捲動容器，sticky 仍然貼視窗
    <div className="relative isolate overflow-x-clip">
      {/* 舊版 .event-bg-color-block__block1：83vw 的青色正圓，
          跟首頁 hero 是同一顆，兩頁的視覺語言一致。
          Topbar 在這一頁是 absolute（不佔空間），所以這層 wrapper
          從頁面最頂端開始 —— 圓會蓋過 Topbar 那一塊，
          Topbar 自己的 z-50 會再壓回圓的上面 */}
      <Decoration className="-top-[35.8vw] -left-[25vw] h-[83vw] w-[83vw] rounded-full bg-brand-teal" />
      {/* 舊版 .event-bg-color-block__block2 */}
      <Decoration
        src="/images/event-bg-color-block2.svg"
        className="top-[12.8vw] -right-[11.6vw] h-[38.9vw] w-[54.2vw]"
      />

      {/* ⚠️ pt 不能維持 py-8：Topbar 現在是 absolute，不佔空間了，
          沒有這段內距內容會直接鑽到 Topbar 底下（舊版是 padding-top: 140px） */}
      <main className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-x-[34px] gap-y-[25px] px-4 pt-[90px] pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,475px)] lg:px-[76px] lg:pt-[120px]">
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

          {/* ⚠️ 裝飾用的假評分，見檔案頂端的說明 */}
          <div className="mb-5 flex items-center gap-[5px]">
            <Image
              src="/images/rating-icon--filled.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden
            />
            <p className="text-[20px] text-ink">
              {PLACEHOLDER_RATING.score}
              <span className="text-ink-muted">
                （{PLACEHOLDER_RATING.count}）
              </span>
            </p>
          </div>

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

          {/* 分隔線。舊版的 .split-line-row：1px、gray-3 */}
          <div className="my-5 h-px w-full bg-[#d9d9d9]" />

          {/* ⚠️ 裝飾用的假標籤，見檔案頂端的說明。
            之後標籤會是可點的（連到搜尋頁），現在還沒有對應的篩選端點 */}
          <div className="flex items-center gap-[6px]">
            <Image
              src="/images/tag-icon.svg"
              alt=""
              width={24}
              height={24}
              aria-hidden
            />
            <ul className="flex flex-wrap items-center gap-[6px]">
              {PLACEHOLDER_TAGS.map((tag) => (
                <li
                  key={tag}
                  className="rounded-[20px] bg-brand-amber px-[10px] py-[5px] text-[14px] text-white"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          </div>
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
    </div>
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
