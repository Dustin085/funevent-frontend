import { redirect } from "next/navigation";
import { OrganizerSetupForm } from "@/features/organizer/components/OrganizerSetupForm";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function OrganizerSetupPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/organizer/setup")}`);
  }

  // 已經有身分了就不該再看到這一頁 —— 後端也會擋（409），
  // 但讓使用者填完才被拒絕是很差的體驗
  const organizer = await getCurrentOrganizer();
  if (organizer) redirect("/organizer/events");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-[22px] font-medium text-ink-soft">
          建立主辦者身分
        </h1>
        <p className="mt-2 mb-6 text-[15px] leading-6 text-ink-muted">
          這個名稱會顯示在你舉辦的每一場活動上。
        </p>
        <OrganizerSetupForm />
      </div>
    </main>
  );
}
