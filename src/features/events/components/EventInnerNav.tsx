"use client";

import { useEffect, useRef, useState } from "react";
// ⚠️ 區塊 id 放在中性模組裡，不放在這個 "use client" 檔案 ——
// Server Component 從 client 模組 import 值會拿到代理而不是真值，
// 詳見 event-sections.ts 的說明
import { EVENT_NAV_ITEMS, SECTION_ANCHOR_OFFSET } from "../event-sections";

/**
 * 活動詳情頁的內部導覽列。從舊專案 event.html 的 .event-inner-nav 移植，
 * 但邏輯整個重寫。
 *
 * ⚠️ 舊版把所有座標事先量好存起來（innerNavOriginTop、zoneLines），
 * 量的那一刻和用的那一刻之間只要有任何變化 —— 圖片載入、換斷點、
 * 字型套用完成 —— 全部失準。這裡改成每次都現讀，不快取任何座標，
 * 所以連 resize 都不需要特別處理。
 */
export function EventInnerNav() {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string>(EVENT_NAV_ITEMS[0].id);
  // 黏住之後上緣圓角要收掉（舊版是用 JS 逐一改 inline style）
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav) return;

      // 導覽列的位置只拿來判斷「黏住了沒」，不拿來當掃描線
      setStuck(nav.getBoundingClientRect().top <= 0);

      // ⚠️ 掃描線是固定的視窗座標，不能用導覽列的現在位置去算。
      // 導覽列在黏住之前是在頁面中段的，那時候的 bottom 毫無意義；
      // 而且「活動介紹」的上緣正好貼著導覽列下緣，
      // 用 bottom 當線的話它從第一幀就恆為「已越過」，
      // 第一個分頁就永遠不會亮
      const line = SECTION_ANCHOR_OFFSET + 1;

      // 「最後一個上緣已經越過掃描線的區塊」就是目前所在的區塊。
      // 這個問法永遠恰好選中一個：不會全部落空，也不會兩個同時亮。
      // 舊版問的是「我在哪兩條線之間」，區間之間有縫
      let current: string = EVENT_NAV_ITEMS[0].id;
      for (const item of EVENT_NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }

      // ⚠️ 捲到底時強制選最後一節。最後一節如果不夠高，
      // 它的上緣永遠碰不到掃描線 —— 舊版就是死在這個情況
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = EVENT_NAV_ITEMS[EVENT_NAV_ITEMS.length - 1].id;

      setActiveId(current);
    };

    // rAF 節流：scroll 一秒可以觸發數百次，但畫面一秒最多更新 60 次。
    // 多出來的計算純粹是浪費，而且每次都會強制瀏覽器重算 layout
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // 沒快取座標，理論上 resize 不必處理；但改視窗大小時使用者
    // 可能完全沒捲動，還是要主動重算一次
    window.addEventListener("resize", onScroll);

    return () => {
      // ⚠️ 舊版最大的 bug 是 resize 時重新註冊卻沒移除舊的，
      // 拉十次視窗就疊十組 listener。useEffect 的 cleanup
      // 讓這件事在結構上就不可能發生
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="活動內容導覽"
      // ⚠️ sticky 只在「父元素的範圍內」有效 ——
      // 所以這個元件必須是「裝著全部區塊的那層」的直接子元素，
      // 不能為了排版方便再包一層只裝活動介紹的 div，
      // 否則捲過活動介紹之後導覽列就跟著消失了
      className="sticky top-0 z-10"
    >
      {/* 手機上六個分頁排不下（四個中文字 + 內距 ≈ 74px，一格只有 62px），
          改成可以橫向滑動 */}
      <ul className="flex overflow-x-auto">
        {EVENT_NAV_ITEMS.map((item) => {
          const active = item.id === activeId;
          return (
            <li
              key={item.id}
              className="flex shrink-0 justify-center sm:flex-1 sm:shrink"
            >
              <a
                href={`#${item.id}`}
                // aria-current：讓螢幕閱讀器也知道現在在哪一節，
                // 而不是只靠顏色傳達
                aria-current={active ? "location" : undefined}
                className={`funevent-shadow w-full px-[9px] py-[14px] text-center text-[16px] font-bold text-white transition-colors duration-[350ms] sm:text-[20px] ${
                  stuck ? "rounded-none" : "rounded-t-[20px]"
                } ${active ? "bg-brand" : "bg-[#b5b5b6] hover:bg-[#898989]"}`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
