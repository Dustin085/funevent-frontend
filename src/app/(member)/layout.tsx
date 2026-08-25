import { MemberSidebar } from "@/features/account/components/MemberSidebar";
import { getCurrentUser } from "@/lib/get-current-user";

/**
 * 會員中心的殼：左側邊欄 + 右內容區。
 *
 * ⭐ (member) 是 route group —— 括號目錄**不會出現在網址裡**，
 * 所以 /account 與 /orders 的網址完全不變，只是共用了這個 layout。
 * 既有連結一行都不用改。
 *
 * ⚠️ 這裡刻意**不做** auth guard：layout 拿不到 pathname，
 * 組不出 ?next= 的回程路徑。各頁自己 redirect 才知道要回哪裡。
 * 這裡只負責顯示，getCurrentUser() 有 cache()，不會多打一次後端。
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row">
      <MemberSidebar userName={user?.name ?? null} />
      {/* min-w-0：不加的話 grid/flex 子項的最小寬度是內容寬度，
          裡面的長字串（活動名稱）會把整個版面撐出橫向捲軸 */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
