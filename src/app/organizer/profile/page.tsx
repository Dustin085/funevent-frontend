import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizerSetupForm } from "@/features/organizer/components/OrganizerSetupForm";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";

// robots noindex：要登入才有內容，爬蟲只會拿到空殼
export const metadata: Metadata = {
  title: "主辦單位資料",
  robots: { index: false },
};

/**
 * ⚠️ 這一頁不做「唯讀 + 編輯鈕」——那個模式是給「主要用途是看」的頁面用的
 *（活動編輯頁）。這一頁的存在目的本來就是編輯，多一次點擊只是礙事。
 */
export default async function OrganizerProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/organizer/profile")}`);
  }
  // 還不是主辦者就沒有東西可以改 —— 送去建立身分的引導
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/organizer/setup");

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:px-8">
      <Link
        href="/organizer/events"
        className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-brand"
      >
        ← 回到我的活動
      </Link>

      <h1 className="text-[24px] font-medium text-ink-soft sm:text-[28px]">
        主辦單位資料
      </h1>

      <section className="rounded-[10px] bg-white p-6 funevent-shadow sm:p-8">
        {/* ⚠️ 這兩個欄位會出現在每一個活動頁上（詳情頁的「主辦單位」區塊
            與資訊卡），所以改動是立即公開可見的 */}
        <p className="mb-5 text-[14px] text-ink-muted">
          這裡的名稱與介紹會顯示在你所有的活動頁面上。
        </p>
        <OrganizerSetupForm organizer={organizer} />
      </section>
    </main>
  );
}
