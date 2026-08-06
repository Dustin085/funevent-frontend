"use client";

import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import type { UserResponse } from "@/lib/api-types";

/**
 * 從舊專案 web/assets/js/Topbar.jsx 移植。
 *
 * 保留的：版面結構（左 logo、右選單）、橘色下圓角膠囊按鈕的視覺語言、三個選單項目。
 *
 * 改掉的：
 * - 登入狀態不再讀 localStorage —— 由 Server Component 透過 props 傳入，
 *   資料來源是 httpOnly cookie，客戶端無從偽造。
 * - 移除內嵌的 LoginOverlay —— 登入改成獨立的 /login 頁面。
 * - 移除 jQuery 動畫（SearchDrawer）—— 之後要做搜尋時用 CSS transition 重寫。
 * - CSS 沒有移植，改用 Tailwind 重寫；色票取自舊專案的 :root 變數。
 */
export function Topbar({ user }: { user: UserResponse | null }) {
  return (
    <header className="flex w-full items-start justify-between">
      {/* 左側：Logo + 地區 */}
      <div className="flex items-center">
        <h1 className="mt-6 ml-8">
          <Link href="/" className="flex items-start gap-3">
            <Image
              src="/images/logo-en-alt-color.svg"
              alt="FunEvent"
              width={152}
              height={41}
              priority
            />
            <Image
              src="/images/logo-tc-alt-color.svg"
              alt="活動趣"
              width={168}
              height={46}
              priority
            />
          </Link>
        </h1>

        <div className="mt-8 ml-12 flex items-center gap-2">
          <Image src="/images/map-pin-icon.svg" alt="" width={29} height={29} loading="eager" />
          <p className="text-ink">雙北</p>
        </div>
      </div>

      {/* 右側：選單。膠囊從頂端垂下來、只有下方圓角 —— 舊設計的視覺記憶點 */}
      <nav>
        <ul className="flex">
          <li>
            <button type="button" className={menuBtnClass}>
              <Image src="/images/search-icon.svg" alt="" width={29} height={29} loading="eager" />
              <span>找活動</span>
            </button>
          </li>

          <li>
            {user ? (
              <Link href="/member" className={menuBtnClass}>
                <Image src="/images/login-icon.svg" alt="" width={29} height={29} loading="eager" />
                <span>你好，{user.name}</span>
              </Link>
            ) : (
              <Link href="/login" className={menuBtnClass}>
                <Image src="/images/login-icon.svg" alt="" width={29} height={29} loading="eager" />
                <span>註冊/登入</span>
              </Link>
            )}
          </li>

          <li>
            <button type="button" className={menuBtnClass}>
              <Image src="/images/ticket-icon.svg" alt="" width={29} height={29} loading="eager" />
              <span>辦活動</span>
            </button>
          </li>

          {user && (
            <li className="mr-5">
              {/* 共用 LogoutButton，只換樣式，登出邏輯不重複實作 */}
              <LogoutButton
                className={`${menuBtnClass} bg-brand-teal hover:bg-brand-teal-hover disabled:opacity-60`}
              />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

/**
 * 舊 CSS 的 .topbar-menu__btn：
 *   padding: 17px 21px; background: var(--primary-1); border-radius: 0 0 30px 30px;
 *   margin-right: 8.5px; font-size: 24px; font-weight: 500; transition: .35s;
 */
const menuBtnClass =
  "mr-2 flex items-center gap-2 rounded-b-[30px] bg-brand px-5 py-4 " +
  "text-xl font-medium text-white transition-colors duration-350 hover:bg-brand-hover";
