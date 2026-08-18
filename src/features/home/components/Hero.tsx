import Image from "next/image";
import { HeroCarousel } from "./HeroCarousel";
import type { HeroSlide } from "./HeroCarousel";

/**
 * 一場有封面圖的活動都沒有時的退路。
 * hero 是首屏主視覺 —— 放品牌色漸層佔位會很像壞掉，寧可用行銷圖。
 * 這些圖沒有可以去的地方，所以不帶 href（點擊維持「換下一張」）。
 */
const FALLBACK_SLIDES: HeroSlide[] = [
  { imageUrl: "/images/hero/slide-1.jpg" },
  { imageUrl: "/images/hero/slide-2.jpg" },
  { imageUrl: "/images/hero/slide-3.jpg" },
  { imageUrl: "/images/hero/slide-4.jpg" },
  { imageUrl: "/images/hero/slide-5.jpg" },
];

/**
 * 從舊專案 index.html 的 #home-page-first-view 移植。
 *
 * 保留：左右各半的版面、白色 slogan、圓角膠囊搜尋框、
 * 右側用 SVG 遮罩裁出的不規則圖片、左上角那顆巨大的青色圓。
 *
 * 那顆圓是關鍵而不是裝飾 —— slogan 是白色的，沒有它就看不見。
 * 舊版用 .home-page-bg-color-block__block1：83vw 的正圓，
 * 定位在 left:-25vw / top:-35.8vw，這裡照搬。
 *
 * 輪播是淡入淡出式的，不需要套件，見 HeroCarousel。
 */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const heroSlides = slides.length > 0 ? slides : FALLBACK_SLIDES;

  return (
    // isolate：建立堆疊脈絡，把內部的 z-10 / z-20 關在這個區塊裡，
    // 不會跑到根層級去跟 Topbar 的 z-50 排隊。主動劃清界線，而不是靠數字剛好排對
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden">
      {/* 背景色塊。用「正 z + pointer-events-none」把圓拉到輪播「前面」，
          而不是用負 z 把輪播推到後面 ——
          後者只要祖先有 transform 就會失效（transform 會建立堆疊脈絡，
          filter / opacity / mask / will-change 也會）。
          圓是純裝飾不吃事件，所以點擊會直接穿透到下面的輪播 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-10 h-[83vw] w-[83vw] -translate-x-1/2 rounded-full bg-brand-teal lg:-top-[35.8vw] lg:-left-[25vw] lg:translate-x-0"
      />

      {/* 左半：logo + slogan + 搜尋框。z-20 才會蓋在圓之上 */}
      <div className="relative z-20 flex w-full flex-col items-center gap-[25px] px-4 lg:w-1/2">
        <Image
          src="/images/logo-tc.svg"
          alt="活動趣"
          width={414}
          height={112}
          priority
          className="h-auto w-[260px] sm:w-[414px]"
        />
        <h2 className="text-[24px] font-medium text-white sm:text-[35px]">
          探索，一切可能
        </h2>

        {/* ⚠️ TODO：目前不能送出。後端還沒有關鍵字搜尋（?q=），
            而 /search 已經存在了 —— 要讓它能用，後端得加 q 參數，
            那時 category × keyword 會讓衍生查詢變成 4 種組合，
            該換成 Specification。 */}
        <div className="relative w-full max-w-[490px]">
          <input
            type="text"
            placeholder="推薦活動名字"
            aria-label="搜尋活動（尚未開放）"
            className="h-[54px] w-full rounded-full border-2 border-brand-amber bg-white px-6 pr-14 text-[18px] text-ink-title transition-transform duration-[350ms] outline-none hover:scale-105 hover:border-brand-hover sm:h-[62px] sm:text-[24px]"
          />
          <Image
            src="/images/search-icon-gray.svg"
            alt=""
            width={28}
            height={28}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2"
          />
        </div>
      </div>

      {/* 右半：主視覺輪播。手機上藏起來 —— 它會佔掉半個螢幕又擠壓左側內容。
          ⚠️ 這一層不能有負的 z-index：圖片層自己會沉到青色圓之下，
          但互動層必須留在正常層級，否則點不到 */}
      <div className="hidden lg:block lg:w-1/2">
        <HeroCarousel slides={heroSlides} />
      </div>
    </section>
  );
}
