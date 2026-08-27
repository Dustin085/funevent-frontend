"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { formatEventDateTime } from "@/lib/format-date";
import type { TicketResponse } from "@/lib/api-types";

/**
 * 一張票。圓角長方形 + 一顆「顯示 QR」按鈕，點了開 modal 置中放大。
 *
 * ⚠️ 刻意沒有做舊專案那種票根造型（鋸齒邊、半圓缺口）——
 * 那組 CSS 很脆，而且對「掃得到票」這件事沒有幫助。
 */
/** QR 打開著時的輪詢間隔。⚠️ 只在打開時輪詢，關掉就停 */
const POLL_INTERVAL_MS = 4000;

export function TicketCard({ ticket }: { ticket: TicketResponse }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const used = ticket.status !== "VALID";

  /**
   * ⭐ QR 打開著的時候才輪詢。
   *
   * 買家把手機舉給工作人員掃的那一刻，分頁是**可見**的 ——
   * RefreshOnVisible 的 visibilitychange 不會觸發，只能靠輪詢。
   *
   * ⚠️ 範圍刻意限制在「QR 打開著」：那正是狀態最需要準確的時候，
   * 而且使用者不會讓它開著走來走去。關掉就停，閒置時零成本。
   */
  useEffect(() => {
    if (!open || used) return;
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [open, used, router]);

  return (
    <li className="flex flex-col gap-3 rounded-[10px] bg-white p-5 funevent-shadow sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-[18px] font-medium text-ink-soft">
          {ticket.eventName}
        </p>
        <p className="text-[16px] text-ink-soft">{ticket.ticketTypeName}</p>
        {used ? (
          <p className="mt-1 text-[14px] text-ink-muted">
            {ticket.status === "VOID"
              ? "此票券已作廢"
              : `已於 ${ticket.usedAt ? formatEventDateTime(ticket.usedAt) : "先前"} 入場`}
          </p>
        ) : (
          <p className="mt-1 text-[14px] text-brand-teal">可入場</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        className="shrink-0 self-start rounded-[10px] bg-brand px-5 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50 sm:self-auto"
        disabled={used}
      >
        {used ? "已使用" : "顯示 QR"}
      </button>

      <TicketQrDialog
        ref={dialogRef}
        ticket={ticket}
        onClose={() => setOpen(false)}
      />
    </li>
  );
}

/**
 * ⭐ 用原生的 <dialog> + showModal()，不是自己刻一個 absolute div。
 * 免費拿到三件手刻很麻煩的事：
 * <ul>
 *   <li>焦點被鎖在對話框裡（Tab 不會跑到後面的頁面）</li>
 *   <li>Esc 關閉</li>
 *   <li>渲染在 top layer —— 完全不用跟 Decoration、Topbar 的 z-index 打架</li>
 * </ul>
 *
 * ⚠️ 唯一要自己補的是「點背景關閉」：<dialog> 預設不會。
 */
function TicketQrDialog({
  ref,
  ticket,
  onClose,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  ticket: TicketResponse;
  onClose: () => void;
}) {
  const used = ticket.status !== "VALID";
  // ⚠️ 元件卸載時要確保對話框關掉 —— 開著的 dialog 留在 top layer
  // 會擋住整個頁面，而且沒有任何東西能關掉它
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, [ref]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`ticket-${ticket.id}-title`}
      // ⚠️ <dialog> 預設有自己的邊框與 margin，要清掉才置中
      className="m-auto rounded-[10px] p-0 backdrop:bg-black/60"
      // ⚠️ onClose 涵蓋所有關閉方式（Esc、close()、按鈕），
      // 只在按鈕上 setOpen(false) 會漏掉 Esc，輪詢就停不下來
      onClose={onClose}
      // 點在 dialog 元素本身 = 點到背景（內容在裡面那層 div 上）
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center">
          <p
            id={`ticket-${ticket.id}-title`}
            className="text-[18px] font-medium text-ink-soft"
          >
            {ticket.eventName}
          </p>
          <p className="text-[16px] text-ink-muted">{ticket.ticketTypeName}</p>
        </div>

        {used ? (
          /* ⭐ 被核銷時 QR 就地換成完成狀態，而不是把對話框關掉 ——
             買家剛被掃完正看著螢幕，突然關閉會讓人以為出錯了。
             這是輪詢真正的價值：入場那一刻就看得到確認 */
          <div className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-2 rounded-[10px] bg-brand-teal text-white">
            <span className="text-[48px] leading-none">✓</span>
            <p className="text-[20px] font-medium">
              {ticket.status === "VOID" ? "此票券已作廢" : "已完成入場"}
            </p>
            {ticket.usedAt && (
              <p className="text-[14px] opacity-80">
                {formatEventDateTime(ticket.usedAt)}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ⭐ QR 在瀏覽器端算出來畫成 SVG —— 憑證不會離開這台裝置。
                level="M" 是容錯率，手機螢幕反光時比較掃得到 */}
            <QRCodeSVG
              value={ticket.qrContent}
              size={240}
              level="M"
              marginSize={2}
            />

            <p className="max-w-[240px] text-center text-[13px] text-ink-muted">
              ⚠️ 這是入場憑證，請勿外流或截圖分享。一張票只能使用一次。
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="rounded-[10px] border border-[#d9d9d9] px-6 py-2 text-ink-soft transition-colors duration-[350ms] hover:border-brand"
        >
          關閉
        </button>
      </div>
    </dialog>
  );
}
