"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
 * - 定位方式：舊專案是「一律 absolute + 其他頁面各自補 margin-top」，
 *   那表示 Topbar 的高度散落在每一頁；改成只有底下鋪了色塊的頁面 absolute，
 *   其他頁面走正常文件流，就沒有要同步維護的間距了。
 * - CSS 沒有移植，改用 Tailwind 重寫；色票取自舊專案的 :root 變數。
 *
 * RWD：手機上只留圖示、隱藏文字標籤。四個按鈕帶文字在 375px 寬度下必定溢出，
 * 而縮小膠囊比換成漢堡選單更能保住舊設計的視覺記憶點。
 */
export function Topbar({ user }: { user: UserResponse | null }) {
  const pathname = usePathname();

  // 「浮動」的頁面：Topbar 底下有大面積深色色塊可以壓，
  // 所以絕對定位（不佔空間）+ 白色 logo。
  // 其他頁面是正常文件流，logo 用彩色版 —— 白色 logo 在淺色背景上會消失。
  // ⚠️ 這裡判斷的是「這一頁有沒有深色底」，不是「這是哪一頁」——
  // 之後任何頁面要放 hero 色塊，加進這個判斷即可
  const isHome = pathname === "/";
  const isEventDetail = /^\/events\/[^/]+$/.test(pathname);
  const isFloating = isHome || isEventDetail;

  // 左上角的底色決定 logo 用哪一版，見 Logo 的說明
  const logoWhite: LogoWhite = isEventDetail
    ? "always"
    : isHome
      ? "desktop"
      : "never";

  return (
    <header
      className={`flex w-full items-start justify-between gap-2 ${
        isFloating ? "absolute inset-x-0 top-0 z-50" : "relative"
      }`}
    >
      {/* 左側：Logo */}
      <h1 className="mt-3 ml-3 sm:mt-6 sm:ml-8">
        <Link href="/" className="flex items-start gap-2 sm:gap-3">
          <Logo
            whiteSrc="/images/logo-en.svg"
            colorSrc="/images/logo-en-alt-color.svg"
            alt="FunEvent"
            width={152}
            height={41}
            widthClass="w-[92px] sm:w-[152px]"
            white={logoWhite}
          />
          <Logo
            whiteSrc="/images/logo-tc.svg"
            colorSrc="/images/logo-tc-alt-color.svg"
            alt="活動趣"
            width={168}
            height={46}
            widthClass="w-[102px] sm:w-[168px]"
            white={logoWhite}
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
            {/* 登入後連到「我的訂單」—— 會員中心還沒做，
                原本的 /member 點了會是 404 */}
            {user ? (
              <Link href="/orders" className={menuBtnClass}>
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
              >
                <LogoutIcon />
                <span className={menuLabelClass}>登出</span>
              </LogoutButton>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

type LogoWhite = "always" | "desktop" | "never";

/**
 * Logo 有白色與彩色兩版，用哪一版取決於它壓在什麼底色上。
 *
 * "desktop"（首頁）：桌機壓在青色圓上用白色，
 *   但手機版的圓移到畫面中央，左上角仍是淺色格線背景 —— 白色會直接消失。
 * "always"（活動詳情頁）：青色圓固定在左上角，兩種尺寸都壓在青色上。
 *
 * "desktop" 會把兩張都渲染、用斷點切換顯示：
 * <img src> 沒辦法用 media query 切換，而這兩個 SVG 各只有幾 KB。
 * 被 display:none 的那張不會進無障礙樹，所以不會有重複朗讀的問題。
 */
function Logo({
  whiteSrc,
  colorSrc,
  alt,
  width,
  height,
  widthClass,
  white,
}: {
  whiteSrc: string;
  colorSrc: string;
  alt: string;
  width: number;
  height: number;
  widthClass: string;
  white: LogoWhite;
}) {
  if (white !== "desktop") {
    return (
      <Image
        src={white === "always" ? whiteSrc : colorSrc}
        alt={alt}
        width={width}
        height={height}
        priority
        className={`h-auto ${widthClass}`}
      />
    );
  }

  return (
    <>
      <Image
        src={colorSrc}
        alt={alt}
        width={width}
        height={height}
        priority
        className={`h-auto ${widthClass} lg:hidden`}
      />
      <Image
        src={whiteSrc}
        alt={alt}
        width={width}
        height={height}
        priority
        className={`hidden h-auto ${widthClass} lg:block`}
      />
    </>
  );
}

/**
 * 登出圖示。舊專案沒有這個圖示（它的登出在會員中心側欄，是純文字按鈕，
 * Topbar 根本沒有登出），所以這是新畫的。
 *
 * 用 inline SVG 而不是 <Image> 載入檔案：描邊走 currentColor，
 * 自動跟著按鈕的白色文字，不需要再做一個白色變體檔。
 */
function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-[22px] w-[22px] sm:h-[29px] sm:w-[29px]"
    >
      {/* 門框 */}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      {/* 向外的箭頭 */}
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
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
