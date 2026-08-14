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
 * - 移除「雙北」地區顯示 —— 後端沒有地區欄位也沒有篩選端點，
 *   先不放「看起來可以點但什麼都不會發生」的 UI。
 * - CSS 沒有移植，改用 Tailwind 重寫；色票取自舊專案的 :root 變數。
 *
 * RWD：手機上只留圖示、隱藏文字標籤。四個按鈕帶文字在 375px 寬度下必定溢出，
 * 而縮小膠囊比換成漢堡選單更能保住舊設計的視覺記憶點。
 */
export function Topbar({ user }: { user: UserResponse | null }) {
  return (
    <header className="flex w-full items-start justify-between gap-2">
      {/* 左側：Logo */}
      <h1 className="mt-3 ml-3 sm:mt-6 sm:ml-8">
        <Link href="/" className="flex items-start gap-2 sm:gap-3">
          <Image
            src="/images/logo-en-alt-color.svg"
            alt="FunEvent"
            width={152}
            height={41}
            priority
            className="h-auto w-[92px] sm:w-[152px]"
          />
          <Image
            src="/images/logo-tc-alt-color.svg"
            alt="活動趣"
            width={168}
            height={46}
            priority
            className="h-auto w-[102px] sm:w-[168px]"
          />
        </Link>
      </h1>

      {/* 右側：選單。膠囊從頂端垂下來、只有下方圓角 —— 舊設計的視覺記憶點 */}
      <nav>
        <ul className="flex">
          <li>
            <button type="button" className={menuBtnClass}>
              <MenuIcon src="/images/search-icon.svg" />
              <span className={menuLabelClass}>找活動</span>
            </button>
          </li>

          <li>
            {user ? (
              <Link href="/member" className={menuBtnClass}>
                <MenuIcon src="/images/login-icon.svg" />
                {/* 名字可能很長，限制寬度後截斷，不讓它把整列撐開 */}
                <span className={`${menuLabelClass} max-w-[12ch] truncate`}>
                  你好，{user.name}
                </span>
              </Link>
            ) : (
              <Link href="/login" className={menuBtnClass}>
                <MenuIcon src="/images/login-icon.svg" />
                <span className={menuLabelClass}>註冊/登入</span>
              </Link>
            )}
          </li>

          <li>
            <button type="button" className={menuBtnClass}>
              <MenuIcon src="/images/ticket-icon.svg" />
              <span className={menuLabelClass}>辦活動</span>
            </button>
          </li>

          {user && (
            <li className="mr-3 sm:mr-5">
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

function MenuIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={29}
      height={29}
      loading="eager"
      className="h-auto w-[22px] sm:w-[29px]"
    />
  );
}

/**
 * 舊 CSS 的 .topbar-menu__btn：
 *   padding: 17px 21px; background: var(--primary-1); border-radius: 0 0 30px 30px;
 *   margin-right: 8.5px; font-size: 24px; font-weight: 500; transition: .35s;
 *
 * ⚠️ duration 要寫成 [350ms]：Tailwind 的 duration 沒有 350 這一階
 * （預設只到 75/100/150/200/300/500/700/1000），寫 duration-350 產生不出任何 CSS。
 */
const menuBtnClass =
  "mr-1 sm:mr-2 flex items-center gap-1.5 sm:gap-2 rounded-b-[20px] sm:rounded-b-[30px] " +
  "bg-brand px-3 py-3 sm:px-5 sm:py-4 text-base sm:text-xl font-medium text-white " +
  "transition-colors duration-[350ms] hover:bg-brand-hover";

/** 手機上只留圖示 —— 四個按鈕帶文字在 375px 寬度下一定會溢出 */
const menuLabelClass = "hidden sm:inline";
