import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventInfoSection } from "@/features/organizer/components/EventInfoSection";
import { EventStatusActions } from "@/features/organizer/components/EventStatusActions";
import { EventStatusBadge } from "@/features/organizer/components/EventStatusBadge";
import { TicketTypeSection } from "@/features/organizer/components/TicketTypeSection";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";
import { SpringApiError, springGet } from "@/lib/spring";
import type {
  CategoryResponse,
  CityResponse,
  EventResponse,
  TicketTypeResponse,
} from "@/lib/api-types";

interface OrganizerEventDetail {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
}

export const metadata: Metadata = {
  title: "編輯活動",
  robots: { index: false },
};

export default async function EditEventPage({
  params,
}: PageProps<"/organizer/events/[id]">) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/organizer/events/${id}`)}`);
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/organizer/setup");

  let detail: OrganizerEventDetail;
  let categories: CategoryResponse[];
  let cities: CityResponse[];
  try {
    [detail, categories, cities] = await Promise.all([
      springGet<OrganizerEventDetail>(`/api/organizers/me/events/${id}`, {
        auth: true,
      }),
      springGet<CategoryResponse[]>("/api/categories", { revalidate: 3600 }),
      springGet<CityResponse[]>("/api/cities", { revalidate: 3600 }),
    ]);
  } catch (error) {
    // 不是你的活動，或活動不存在 —— 後端兩種都回 404，不洩漏存在性
    if (error instanceof SpringApiError && error.status === 404) notFound();
    throw error;
  }

  const { event, ticketTypes } = detail;

  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/organizer/events"
            className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-brand"
          >
            ← 回到我的活動
          </Link>
          <Link
            href={`/organizer/events/${id}/orders`}
            className="text-[14px] text-brand-teal transition-colors duration-[350ms] hover:text-brand-teal-hover"
          >
            查看訂單與銷售 →
          </Link>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-medium text-ink-soft sm:text-[28px]">
              {event.name}
            </h1>
            <EventStatusBadge status={event.status} />
          </div>
          <EventStatusActions eventId={event.id} status={event.status} />
        </div>
      </div>

      <section className="rounded-[10px] bg-white p-6 funevent-shadow sm:p-8">
        <h2 className="mb-5 text-[20px] font-medium text-ink-soft">活動資訊</h2>
        <EventInfoSection event={event} categories={categories} cities={cities} />
      </section>

      <section className="rounded-[10px] bg-white p-6 funevent-shadow sm:p-8">
        <h2 className="mb-5 text-[20px] font-medium text-ink-soft">票種</h2>
        <TicketTypeSection eventId={event.id} ticketTypes={ticketTypes} />
      </section>
    </main>
  );
}
