import { Decoration } from "@/components/Decoration";
import { MemberSidebar } from "@/features/account/components/MemberSidebar";
import { getCurrentUser } from "@/lib/get-current-user";

/**
 * 會員中心的殼：背景色塊 + 左側邊欄 + 右內容區。
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
    // ⚠️ 這層滿寬的 wrapper 不能省：色塊要溢出視窗再被切掉，
    // 包在下面那層 max-w-[1100px] 裡的話會停在內容區旁邊，變成浮在旁邊的橢圓。
    // isolate 是 Decoration 的 -z-10 不逃到根層級的前提
    <div className="relative isolate overflow-x-clip">
      {/* 從舊版 .member-center-bg-color-block__block1～4 移植。
          block1 跟首頁 hero、活動詳情頁是同一顆青色大圓，視覺語言一致 */}
      <Decoration
        src="/images/member-center-bg-color-block2.svg"
        className="top-[36.8vw] left-[4.72vw] h-[21.8vw] w-[12.5vw] rotate-[42.11deg]"
      />
      {/* ⚠️ 舊版這顆的縱向位移是寫死的 789px —— 正是 Decoration 的註解裡
          在批評的那種寫法。會員中心的內容高度差很多（訂單列表 vs 帳號表單
          兩三個欄位），照抄一定錯位，所以換算成 vw */}
      <Decoration
        src="/images/member-center-bg-color-block3.svg"
        className="top-[55vw] left-[67.2vw] h-[21.8vw] w-[12.5vw] rotate-[116.26deg]"
      />
      {/* ⚠️ 92.37vw 會讓它大半跑出畫面右側，靠最外層的 overflow-x-clip 切掉 */}
      <Decoration
        src="/images/member-center-bg-color-block4.svg"
        className="top-[40.2vw] left-[92.37vw] h-[9.23vw] w-[9.23vw]"
      />

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-8 sm:px-8 lg:items-start lg:flex-row lg:gap-[30px]">
        <MemberSidebar userName={user?.name ?? null} />
        {/* min-w-0：不加的話 flex 子項的最小寬度是內容寬度，
            裡面的長字串（活動名稱）會把整個版面撐出橫向捲軸 */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
