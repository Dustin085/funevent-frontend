import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventForm } from "@/features/organizer/components/EventForm";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";
import { springGet } from "@/lib/spring";
import type { CategoryResponse, CityResponse } from "@/lib/api-types";

export const metadata: Metadata = {
  title: "建立活動",
  robots: { index: false },
};

export default async function NewEventPage() {
  // 和列表頁一樣的三段式入口判斷
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/organizer/events/new")}`);
  }
  const organizer = await getCurrentOrganizer();
  // 這一頁沒有「建立身分」的引導畫面，直接送去 setup ——
  // 使用者是從列表頁的按鈕過來的，那裡已經擋過一次了
  if (!organizer) redirect("/organizer/setup");

  // 兩份清單都是 enum，內容永遠不變，快取一小時
  const [categories, cities] = await Promise.all([
    springGet<CategoryResponse[]>("/api/categories", { revalidate: 3600 }),
    springGet<CityResponse[]>("/api/cities", { revalidate: 3600 }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <Link
          href="/organizer/events"
          className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-brand"
        >
          ← 回到我的活動
        </Link>
        <h1 className="mt-2 text-[24px] font-medium text-ink-soft sm:text-[28px]">
          建立活動
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          建立後是草稿狀態，加好票種再發布。
        </p>
      </div>

      <div className="rounded-[10px] bg-white p-6 funevent-shadow sm:p-8">
        <EventForm categories={categories} cities={cities} />
      </div>
    </main>
  );
}
