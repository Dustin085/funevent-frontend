"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * 評論內文：預設截斷三行，可展開。
 *
 * 這是整個評論區唯一需要 client 的部分 —— 其餘都是靜態畫面，
 * 所以只把這一小塊切成 Client Component，不要整個評論區都變 client。
 */
export function CommentText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  // 只有真的被截斷時才顯示「展開」—— 短評論配一個按不出東西的按鈕很怪
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      // ⚠️ 展開之後 scrollHeight 必定等於 clientHeight，這時候量會得到
      // 「沒有被截斷」→ 按鈕消失 → 再也收不回去。所以展開狀態下不重量，
      // 沿用收合時量到的結果
      if (expanded) return;
      // scrollHeight 是內容的完整高度，clientHeight 是被 line-clamp 切過的高度。
      // 差 1px 以內當成沒截斷，避免小數點誤差
      setClamped(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    // 換行位置會隨寬度改變 —— 不能只在掛載時量一次
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <div className="flex flex-col">
      <p
        ref={ref}
        className={`text-[16px] leading-[1.45] text-ink-title ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>

      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 flex items-center gap-[7px] self-end text-[16px] font-medium text-brand-teal"
        >
          {expanded ? "收合" : "展開"}
          <Image
            src="/images/arrow-down.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden
            className={`transition-transform duration-[350ms] ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
