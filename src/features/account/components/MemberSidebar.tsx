"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

/**
 * 會員中心側邊欄。從舊專案 MemberCenterSidebar.jsx + styleForMemberCenterTemplate.css 移植。
 *
 * 保留的：260px 寬、上琥珀下白的兩段式卡片、頭像 100px、
 * 三個分組與群組之間的分隔線、滿寬的青色登出鈕、24px 圖示 + 12px 間距。
 *
 * ⚠️ 刻意**沒有**照抄舊版那八個項目 —— Fun點數、Fun折價卷、訊息管理
 * 完全沒有後端也沒有計畫，放上去就是三個點了沒反應的連結。
 * 這個專案一路的原則是「不放看起來可以點但什麼都不會發生的 UI」
 *（Topbar 拿掉「雙北」、評論排序做成 disabled，都是同一條）。
 *
 * ⚠️ 舊版的「帳號切換」也沒有照搬：新架構裡主辦者是同一個帳號上的角色，
 * 沒有另一個帳號可以切，所以直接叫「主辦者後台」。
 *
 * ⚠️ 必須是 client 元件 —— active 狀態要靠 usePathname()。
 */
const MENU_GROUPS = [
  {
    title: "我的活動",
    items: [{ href: "/orders", label: "我的訂單", icon: "my-ticket" }],
  },
  {
    title: "帳號設定",
    items: [
      { href: "/account", label: "帳號管理", icon: "account-manage" },
      { href: "/account/comments", label: "我的評論", icon: "my-comment" },
      { href: "/account/favorites", label: "我的收藏", icon: "my-fav" },
    ],
  },
  {
    title: "主辦中心",
    items: [
      { href: "/organizer/events", label: "主辦者後台", icon: "founder-center" },
    ],
  },
] as const;

export function MemberSidebar({ userName }: { userName: string | null }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="會員中心"
      className="overflow-hidden rounded-[10px] funevent-shadow lg:w-[260px] lg:shrink-0"
    >
      {/* __intro：琥珀色底（舊版的 secondary-2） */}
      <div className="flex flex-col items-center gap-2 bg-brand-amber px-6 py-6 lg:py-[30px]">
        {/* ⚠️ 舊版頭像右下角有個編輯鈕。User 沒有頭像欄位、也沒有上傳功能，
            放上去就是死按鈕 —— 只留預設頭像 */}
        {/* ⚠️ 白色外框不能省：頭像本身也是琥珀色系的，
            直接放在同色的 __intro 底上會糊成一片，框才把它跟背景分開 */}
        <Image
          src="/images/member-default-avatar.svg"
          alt=""
          width={100}
          height={100}
          aria-hidden
          className="h-16 w-16 rounded-full border-[3px] border-white lg:h-[100px] lg:w-[100px]"
        />
        {userName && (
          <p className="max-w-full truncate text-[20px] font-medium text-ink">
            {userName}
          </p>
        )}
        <Link
          href="/account"
          className="text-[14px] text-ink transition-opacity duration-[350ms] hover:opacity-70"
        >
          管理個人資料
        </Link>
      </div>

      {/* __menu：白底。⚠️ 手機分兩欄排，否則整張側邊欄會把第一屏佔滿 */}
      <div className="flex flex-col bg-white p-5">
        <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-1 lg:gap-x-0">
          {MENU_GROUPS.map((group, index) => (
            <div key={group.title} className="flex flex-col">
              {/* 群組之間的分隔線（舊版的 split-line-row）。
                  第一組上面不要，桌機才顯示 —— 手機是兩欄，橫線會穿過去很怪 */}
              {index > 0 && (
                <div className="my-2.5 hidden h-px w-full bg-[#d9d9d9] lg:block" />
              )}
              <h2 className="py-[5px] text-[16px] font-bold text-ink">
                {group.title}
              </h2>
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  // ⚠️ 完全相等，不能用 startsWith ——
                  // 否則在 /account/comments 時「帳號管理」也會亮起來
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 py-2.5 text-[16px] font-medium transition-colors duration-[350ms] ${
                          // ⚠️ 舊版只換圖示顏色，文字與底色都不變 ——
                          // 我 grep 過整份 CSS，.active 根本沒有對應規則。
                          // 只靠圖示變色當「你在這一頁」太弱，也可能過不了對比度，
                          // 所以這裡多加了文字變色
                          isActive
                            ? "text-brand"
                            : "text-ink hover:text-brand-hover"
                        }`}
                      >
                        <Image
                          src={`/images/member-center-sidebar-icon/${item.icon}${
                            isActive ? "--active" : ""
                          }.svg`}
                          alt=""
                          width={24}
                          height={24}
                          aria-hidden
                          className="h-6 w-6 shrink-0"
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* 舊版側邊欄底部也有登出（滿寬、40px、青色）。
            共用 LogoutButton，不重複實作登出邏輯 */}
        <LogoutButton className="mt-2.5 h-10 w-full rounded-[10px] bg-brand-teal text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover disabled:opacity-50">
          登出
        </LogoutButton>
      </div>
    </nav>
  );
}
