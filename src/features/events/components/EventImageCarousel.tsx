"use client";

import Image from "next/image";
import { useCarousel } from "@/lib/use-carousel";

/**
 * 從舊專案 event.html 的 .event-intro-carousel 移植。
 *
 * 跟首頁 hero 一樣是淡入淡出，但不自動播放 ——
 * 那是行銷主視覺，這裡是活動照片，使用者正在「看」，自動換掉是干擾。
 *
 * 沒有圖片時完全不渲染：與其顯示一個空的灰框，
 * 不如讓下面的介紹卡直接遞補上來。
 */
export function EventImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const { active, setActive, go } = useCarousel(images.length);

  if (images.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="funevent-shadow relative aspect-[3/2] w-full overflow-hidden rounded-[10px]">
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            // 第一張帶敘述，其餘是同一場活動的補充照片 ——
            // 每張都寫一樣的文字只會讓螢幕閱讀器重複唸好幾次
            alt={index === 0 ? alt : ""}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority={index === 0}
            className={`object-cover transition-opacity duration-[350ms] ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* 只有一張圖就不需要控制列 */}
      {images.length > 1 && (
        <div className="flex items-center pl-2">
          <ArrowButton label="上一張" onClick={() => go(-1)} />
          <div className="mr-[34px] flex items-center gap-[14px]">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`第 ${index + 1} 張`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className={`h-[17px] w-[17px] rounded-full transition-colors duration-[350ms] ${
                  index === active ? "bg-ink-soft" : "bg-[#d9d9d9]"
                }`}
              />
            ))}
          </div>
          <ArrowButton label="下一張" flipped onClick={() => go(1)} />
        </div>
      )}
    </section>
  );
}

/** 舊版只有一張箭頭圖，next 是旋轉 180 度 */
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
      className={`mr-[34px] transition-transform duration-[350ms] hover:scale-110 ${
        flipped ? "rotate-180" : ""
      }`}
    >
      <Image
        src="/images/event-carousel-arrow.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden
      />
    </button>
  );
}
