import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckInProgress } from "@/features/organizer/components/CheckInProgress";
import { CheckInScanner } from "@/features/organizer/components/CheckInScanner";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";
import { SpringApiError, springGet } from "@/lib/spring";
import type {
  CheckInProgressResponse,
  EventResponse,
  TicketTypeResponse,
} from "@/lib/api-types";

interface OrganizerEventDetail {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
}

export const metadata: Metadata = {
  title: "入場驗票",
  robots: { index: false },
};

export default async function CheckInPage({
  params,
}: PageProps<"/organizer/events/[id]/check-in">) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/organizer/events/${id}/check-in`)}`,
    );
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/organizer/setup");

  let detail: OrganizerEventDetail;
  let progress: CheckInProgressResponse;
  try {
    // ⚠️ 這一支已經驗過擁有權（不是你的活動回 404）。
    // 核銷端點自己也會再驗一次 —— 前端的檢查只是為了不要讓人白跑一趟，
    // 真正的把關永遠在後端
    //
    // ⚠️ 進度<b>絕對不能</b>傳 revalidate —— springGet 不傳就是 cache: "no-store"，
    // 那正是這裡要的。這一頁的數字每掃一張就會變，快取住的話工作人員會看到
    // 停在幾分鐘前的入場人數，而且畫面上完全看不出來它是舊的
    [detail, progress] = await Promise.all([
      springGet<OrganizerEventDetail>(`/api/organizers/me/events/${id}`, {
        auth: true,
      }),
      springGet<CheckInProgressResponse>(
        `/api/organizers/me/events/${id}/check-in/progress`,
        { auth: true },
      ),
    ]);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <Link
          href={`/organizer/events/${id}`}
          className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-brand"
        >
          ← 回到活動
        </Link>
        <h1 className="mt-2 text-[24px] font-medium text-ink-soft sm:text-[28px]">
          入場驗票
        </h1>
        <p className="mt-1 text-[16px] text-ink-muted">{detail.event.name}</p>
      </div>

      <CheckInProgress progress={progress} />

      {/* ⚠️ 這一頁要在手機上用，版面刻意窄（max-w-[560px]）：
          掃描區與結果都要一眼看完，不需要橫向掃視 */}
      <CheckInScanner eventId={detail.event.id} />
    </main>
  );
}
