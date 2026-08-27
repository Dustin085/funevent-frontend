"use client";

import Image from "next/image";
import { useCarousel } from "@/lib/use-carousel";

/**
 * 從舊專案 event.html 的 .event-intro-carousel 與 .event-intro-carousel-subtitle 移植。
 *
 * 跟首頁 hero 一樣是淡入淡出，但不自動播放 ——
 * 那是行銷主視覺，這裡是活動照片，使用者正在「看」，自動換掉是干擾。
 *
 * ⚠️ 沒有圖片時**不再回傳 null**（以前是），改成顯示漸層佔位 ——
 * 因為收藏／轉發按鈕住在底下那一列，整個元件消失的話那兩顆也會跟著不見。
 * 佔位用的漸層跟 EventCard 是同一組，視覺語言一致，版面高度也不會跳。
 */
export function EventImageCarousel({
  images,
  alt,
  actions,
}: {
  images: string[];
  alt: string;
  /**
   * 右側的動作按鈕（收藏、轉發）。
   * ⚠️ 放在這裡是因為舊版的 .event-intro-carousel-subtitle 就是
   * 「輪播控制組 + 動作按鈕」同一列（`justify-content: space-between`）。
   */
  actions?: React.ReactNode;
}) {
  const { active, setActive, go } = useCarousel(images.length);

  return (
    <section className="flex flex-col gap-3">
      {images.length > 0 ? (
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
      ) : (
        /* 沒有圖片的佔位。⚠️ 尺寸與圓角、陰影都跟上面那塊一致 ——
           不然有圖與沒圖的活動在版面上會差一截 */
        <div className="funevent-shadow relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-[10px] bg-linear-to-br from-brand-teal to-brand shadow-[inset_0_0_10px_0_rgba(0,0,0,0.5)]">
          <Image
            src="/images/logo-tc.svg"
            alt=""
            width={168}
            height={46}
            aria-hidden
            className="w-[40%] max-w-[220px] opacity-60"
          />
        </div>
      )}

      {/* 舊版的 .event-intro-carousel-subtitle：控制組在左、動作按鈕在右。
          ⚠️ 這一列**永遠渲染** —— 只有一張圖或沒有圖時仍然要顯示右邊的按鈕 */}
      <div className="flex items-center pl-2">
        {/* 只有一張圖就不需要控制項 */}
        {images.length > 1 && (
          <>
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
          </>
        )}

        {/* ⚠️ ml-auto 而不是外層用 justify-between —— 只有一張圖時左邊沒有
            控制項，justify-between 會把按鈕推到最左邊 */}
        {actions && <div className="ml-auto flex gap-[3px]">{actions}</div>}
      </div>
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
