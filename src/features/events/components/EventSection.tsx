import { SectionTitle } from "@/components/SectionTitle";
import { EventCard } from "./EventCard";
import type { EventSummaryResponse } from "@/lib/api-types";

/**
 * 首頁的一排活動卡：標題 + 格線 + 空狀態。
 *
 * 抽出來是因為第二個呼叫端出現了（即將登場、最新上架），
 * 而舊專案的首頁本來就有三排（熱門推薦／本週精選／最新上架）——
 * 「熱門」需要訂單數統計，等後端有了直接再加一個 <EventSection> 就好。
 */
export function EventSection({
  title,
  moreHref,
  events,
  emptyText,
}: {
  title: string;
  moreHref?: string;
  events: EventSummaryResponse[];
  emptyText: string;
}) {
  return (
    <section className="flex flex-col gap-[25px]">
      <SectionTitle title={title} moreHref={moreHref} />

      {events.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <li key={event.id} className="w-full max-w-[304px]">
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
