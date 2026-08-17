"use client";

import Image from "next/image";
import { useCarousel } from "@/lib/use-carousel";

const AUTOPLAY_MS = 5000;

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
export function HeroCarousel({ images }: { images: string[] }) {
  // 行為跟活動詳情頁的輪播共用（見 useCarousel），外觀完全不同
  const { active, setActive, go, paused, setPaused } = useCarousel(
    images.length,
    AUTOPLAY_MS,
  );

  return (
    <div className="relative aspect-[3/2] w-[115%] -translate-x-[15%]">
      {/* 圖片層。誰蓋誰由 Hero 那顆圓的 z-10 決定 —— 這裡不需要負 z-index。
          本元件的根 div 有 transform（-translate-x），會建立堆疊脈絡，
          裡面的負 z-index 根本退不出去 */}
      <div className="absolute inset-0" style={MASK_STYLE}>
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt=""
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

      {/* ⭐ 互動層。<svg> 本身沒有填色所以不接收事件，只有 <path> 會 ——
          不規則形狀之外的長方形區域完全不受影響，這是舊版的做法。
          opacity-0 不影響命中判定：pointer-events 看的是 visibility，不是 opacity。 */}
      <svg viewBox="0 0 936 607" className="absolute inset-0 h-full w-full">
        <path
          d={BLOB_PATH}
          fill="black"
          className="cursor-pointer opacity-0"
          onClick={() => go(1)}
          // 滑鼠在上面時暫停：使用者可能正在看，不該被換掉
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        />
      </svg>

      {/* 控制列 */}
      <div className="absolute -bottom-[10%] left-1/2 flex -translate-x-1/2 items-center gap-[29px]">
        <ArrowButton label="上一張" onClick={() => go(-1)} />
        <div className="flex gap-[14px]">
          {images.map((src, index) => (
            <button
              key={src}
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
