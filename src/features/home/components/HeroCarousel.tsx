"use client";

import Image from "next/image";
import Link from "next/link";
import { useCarousel } from "@/lib/use-carousel";

const AUTOPLAY_MS = 5000;

export type HeroSlide = {
  imageUrl: string;
  /** 有值時整個不規則區域是連結；靜態行銷圖沒有 href，點了只會換下一張 */
  href?: string;
  /** 活動名稱，給 alt 與 aria-label */
  label?: string;
};

/**
 * 舊專案 index.html 裡那個 SVG 的路徑，形狀跟遮罩一致。
 * 它的用途是「只讓不規則形狀內部可以互動」——
 * 直接在長方形容器上綁事件的話，圖片周圍的空白區也會有反應。
 */
const BLOB_PATH =
  "M361.302 59.8489C474.408 38.7982 586.599 -28.6303 691.032 13.6759C819.197 65.5956 931.402 172.209 935.008 292.258C938.651 413.561 833.555 526.122 708.203 585.348C602.989 635.058 478.751 586.265 361.302 563.318C280.149 547.463 206.987 521.983 144.706 475.255C77.2137 424.619 -1.23394 368.511 0.0147165 292.258C1.25617 216.445 79.2162 160.186 150.617 114.255C211.356 75.1827 286.748 73.7244 361.302 59.8489Z";

const MASK_STYLE = {
  maskImage: "url(/images/hero-mask.svg)",
  maskSize: "contain",
  maskPosition: "center",
  maskRepeat: "no-repeat",
  WebkitMaskImage: "url(/images/hero-mask.svg)",
  WebkitMaskSize: "contain",
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
} as const;

/**
 * 首頁主視覺輪播。從舊專案的 #home-page-first-view .carousel 移植。
 *
 * 舊版是淡入淡出（slides 全部疊著切 opacity），不是滑動式 ——
 * 所以不需要輪播套件，useState + setInterval 就夠。
 *
 * 「看起來被青色圓蓋住一角、但仍然可以點」是由 Hero 那邊處理的：
 * 圓用正 z-index 蓋在這個元件之上，並加 pointer-events-none 讓事件穿透。
 * 這裡完全不需要負 z-index。
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  // 行為跟活動詳情頁的輪播共用（見 useCarousel），外觀完全不同
  const { active, setActive, go, paused, setPaused } = useCarousel(
    slides.length,
    AUTOPLAY_MS,
  );
  const current = slides[active];

  return (
    <div className="relative aspect-[3/2] w-[115%] -translate-x-[20%] translate-y-[2%]">
      {/* 圖片層。誰蓋誰由 Hero 那顆圓的 z-10 決定 —— 這裡不需要負 z-index。
          本元件的根 div 有 transform（-translate-x），會建立堆疊脈絡，
          裡面的負 z-index 根本退不出去 */}
      <div className="absolute inset-0" style={MASK_STYLE}>
        {slides.map((slide, index) => (
          <Image
            key={slide.imageUrl}
            src={slide.imageUrl}
            alt={slide.label ?? ""}
            fill
            sizes="50vw"
            priority={index === 0}
            className={`object-cover transition-opacity duration-[350ms] ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* 舊版的 .slide-overlay：hover 時壓暗，給「可以點」的回饋 */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-[350ms] ${
            paused ? "opacity-20" : "opacity-0"
          }`}
        />
      </div>

      <BlobHitArea
        href={current?.href}
        label={current?.label}
        onActivate={() => go(1)}
        onHoverChange={setPaused}
      />

      {/* 控制列 */}
      <div className="absolute -bottom-[10%] left-1/2 flex -translate-x-1/2 items-center gap-[29px]">
        <ArrowButton label="上一張" onClick={() => go(-1)} />
        <div className="flex gap-[14px]">
          {slides.map((slide, index) => (
            <button
              key={slide.imageUrl}
              type="button"
              aria-label={`第 ${index + 1} 張`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className={`h-[17px] w-[17px] rounded-full transition-colors duration-[350ms] ${
                index === active ? "bg-brand" : "bg-[#b5b5b6] hover:bg-ink-title"
              }`}
            />
          ))}
        </div>
        <ArrowButton label="下一張" flipped onClick={() => go(1)} />
      </div>
    </div>
  );
}

/**
 * 不規則形狀的互動區。
 *
 * 有 href 時包一層真的 <Link>：中鍵開新分頁、Ctrl+點、右鍵複製網址都能用，
 * 用 router.push() 就全部失去了，螢幕閱讀器也不會把它當連結。
 *
 * ⚠️ HTML 與 SVG 的命中判定規則不同：
 * SVG 的 <path> 沒填色就不接收事件，但 <a> 就算完全透明，整個矩形照樣接收 ——
 * 直接包起來的話不規則形狀就失效了。
 * 所以 <a> 設 pointer-events-none、只讓 <path> 可命中；
 * 規格明訂事件仍會從子元素冒泡經過 pointer-events:none 的祖先，
 * 所以連結照樣會被觸發。
 */
function BlobHitArea({
  href,
  label,
  onActivate,
  onHoverChange,
}: {
  href?: string;
  label?: string;
  onActivate: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const shape = (
    <svg
      viewBox="0 0 936 607"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <path
        d={BLOB_PATH}
        fill="black"
        className="pointer-events-auto cursor-pointer opacity-0"
        // 滑鼠在上面時暫停：使用者可能正在看，不該被換掉
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        // 沒有連結時（退回靜態行銷圖）維持原本行為：點一下換下一張
        onClick={href ? undefined : onActivate}
      />
    </svg>
  );

  if (!href) return shape;

  return (
    <Link
      href={href}
      aria-label={label ? `查看活動：${label}` : "查看活動"}
      className="pointer-events-none absolute inset-0"
    >
      {shape}
    </Link>
  );
}

/** 舊版只有 prev 一張圖，next 是旋轉 180 度 */
function ArrowButton({
  label,
  flipped = false,
  onClick,
}: {
  label: string;
  flipped?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`group relative h-[50px] w-[50px] ${flipped ? "rotate-180" : ""}`}
    >
      <Image src="/images/caro-arrow.svg" alt="" fill sizes="50px" />
      {/* hover 換圖：兩張疊著切 opacity，比在 Tailwind 任意值裡寫 url() 乾淨 */}
      <Image
        src="/images/caro-arrow-hover.svg"
        alt=""
        fill
        sizes="50px"
        className="opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100"
      />
    </button>
  );
}
