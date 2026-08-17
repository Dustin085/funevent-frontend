"use client";

import { useEffect, useState } from "react";

/**
 * 淡入淡出輪播的共用行為。
 *
 * 首頁 hero 與活動詳情頁的輪播「行為相同、外觀完全不同」
 * （遮罩、圓角、控制列位置、箭頭大小、圓點配色都不一樣），
 * 所以抽的是 hook 而不是元件 —— 抽成元件會需要一大堆樣式 props，
 * 比寫兩個各自專注的元件更難讀。
 *
 * 共用行為就抽 hook，共用外觀才抽元件。
 *
 * @param autoplayMs 不傳就不自動播放（圖庫類的輪播讓使用者自己控制比較好）
 */
export function useCarousel(count: number, autoplayMs?: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  useEffect(() => {
    if (!autoplayMs || paused || count <= 1) return;
    // 尊重系統的「減少動態效果」設定 —— 自動輪播對前庭功能敏感的人是負擔。
    // 停掉自動播放後仍可用箭頭與圓點手動切換
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setActive((i) => (i + 1) % count),
      autoplayMs,
    );
    return () => clearInterval(timer);
  }, [autoplayMs, paused, count]);

  return { active, setActive, go, paused, setPaused };
}
