"use client";

import Image from "next/image";
import { useState } from "react";
import { ActionTooltip } from "./ActionTooltip";
import {
  roundButtonClass,
  roundButtonIconClass,
  roundButtonLabelClass,
} from "./eventActionButtonStyles";

/**
 * 轉發按鈕。從舊專案的 `.funevent-btn-round` + `share-icon` 移植。
 *
 * ⚠️ 目前只做「複製網址」—— 真正的分享（Web Share API、Line／FB 分享連結）
 * 之後再討論。複製網址是所有分享方式都成立的最低共同點，
 * 而且不需要任何第三方 SDK。
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    setError(null);
    try {
      // ⚠️ Clipboard API 需要安全內容（HTTPS 或 localhost）。
      // 部署到 http 的話這裡會直接拋錯 —— 所以要有 catch
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      // 兩秒後變回原本的文字。⚠️ 不用 useEffect 清理 ——
      // 這個元件不會在兩秒內被卸載（它是頁面的固定部件）
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("複製失敗，請手動複製網址");
    }
  };

  return (
    // ⚠️ relative 是 ActionTooltip 的定位基準，不能省
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        // ⚠️ 手機版文字被藏起來，沒有這個的話按鈕就沒有可見名稱了
        aria-label="轉發"
        className={roundButtonClass}
      >
        <Image
          src="/images/share-icon.svg"
          alt=""
          width={24}
          height={24}
          aria-hidden
          className={roundButtonIconClass}
        />
        {/* ⭐ 文字固定是「轉發」，不再隨狀態變 ——
            回饋交給浮動的 tooltip，按鈕寬度就完全不會跳 */}
        <span className={roundButtonLabelClass}>轉發</span>
      </button>

      {copied && <ActionTooltip>已複製連結</ActionTooltip>}
      {error && <ActionTooltip tone="error">{error}</ActionTooltip>}
    </div>
  );
}
