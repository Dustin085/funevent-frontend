"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

/**
 * 會員中心側邊欄。從舊專案 MemberCenterSidebar.jsx 移植分組結構。
 *
 * ⚠️ 刻意**沒有**照抄舊版那八個項目 —— 其中 Fun點數、Fun折價卷、訊息管理
 * 完全沒有後端也沒有計畫，放上去就是三個點了沒反應的連結。
 * 這個專案一路的原則是「不放看起來可以點但什麼都不會發生的 UI」
 *（Topbar 拿掉「雙北」、評論排序做成 disabled，都是同一條）。
 * 功能落地時再把項目加回來。
 *
 * ⚠️ 舊版的「帳號切換」也沒有照搬：新架構裡主辦者是同一個帳號上的角色，
 * 沒有另一個帳號可以切，所以直接叫「主辦者後台」。
 *
 * ⚠️ 必須是 client 元件 —— active 狀態要靠 usePathname()。
 */
const MENU_GROUPS = [
  {
    title: "我的活動",
    items: [{ href: "/orders", label: "我的訂單" }],
  },
  {
    title: "帳號設定",
    items: [
      { href: "/account", label: "帳號管理" },
      { href: "/account/comments", label: "我的評論" },
    ],
  },
  {
    title: "主辦中心",
    items: [{ href: "/organizer/events", label: "主辦者後台" }],
  },
] as const;

export function MemberSidebar({ userName }: { userName: string | null }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="會員中心"
      className="flex flex-col gap-5 rounded-[10px] bg-white p-5 funevent-shadow lg:w-[240px] lg:shrink-0"
    >
      {userName && (
        <p className="truncate text-[18px] font-medium text-ink-soft">
          {userName}
        </p>
      )}

      {/* ⚠️ 手機上收成一列可橫向捲動的頁籤：直欄在小螢幕會佔掉整個第一屏。
          用 overflow-x-auto 而不是換成漢堡選單 —— 四個項目還不需要收合 */}
      <div className="flex gap-5 overflow-x-auto lg:flex-col lg:overflow-visible">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5">
            <h2 className="text-[13px] whitespace-nowrap text-ink-muted">
              {group.title}
            </h2>
            <ul className="flex gap-1.5 lg:flex-col">
              {group.items.map((item) => {
                // ⚠️ 完全相等，不能用 startsWith ——
                // 否則在 /account/comments 時「帳號管理」也會亮起來
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-[8px] px-3 py-2 text-[15px] whitespace-nowrap transition-colors duration-[350ms] ${
                        isActive
                          ? "bg-brand text-white"
                          : "text-ink-soft hover:bg-[#f7f9f9]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 舊版側邊欄底部也有登出。共用 LogoutButton，不重複實作登出邏輯 */}
      <LogoutButton className="hidden rounded-[10px] border border-[#d9d9d9] px-4 py-2 text-[15px] text-ink-soft transition-colors duration-[350ms] hover:border-brand disabled:opacity-50 lg:block">
        登出
      </LogoutButton>
    </nav>
  );
}
