"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatEventDateTime } from "@/lib/format-date";
import type { ApiError, CheckInResponse } from "@/lib/api-types";

/** html5-qrcode 需要一個真實存在的 DOM 元素 id 來掛載影像 */
const READER_ELEMENT_ID = "check-in-reader";

export function CheckInScanner({ eventId }: { eventId: number }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  /** 掃到、預覽過、正在等工作人員確認的那一張 */
  const [pending, setPending] = useState<{
    token: string;
    preview: CheckInResponse;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  /**
   * ⭐ 用 ref 而不是 state 當鎖。
   *
   * ⚠️ 解碼的 callback 每秒會觸發好幾次（同一張 QR 停在畫面上就一直觸發）。
   * 用 state 當鎖的話，setState 是非同步的 —— 在它生效之前已經有好幾次
   * callback 溜過去了，同一張票會被送出三四次。
   * ref 是同步的，設下去立刻生效。
   */
  const lockedRef = useRef(false);

  /** 兩支端點形狀一樣，只差路徑與「有沒有真的改狀態」 */
  const post = useCallback(
    async (path: string, token: string): Promise<CheckInResponse | null> => {
      setError(null);
      try {
        const res = await fetch(
          `/api/organizer/events/${eventId}/check-in${path}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );

        if (!res.ok) {
          // ⚠️ 這裡才是真的錯誤（403 不是你的活動、502 連不上）——
          // 「已使用」「無效」是 200 帶結果回來的
          const apiError: ApiError = await res
            .json()
            .catch(() => ({}) as ApiError);
          setError(apiError.message ?? "操作失敗，請稍後再試");
          return null;
        }
        return await res.json();
      } catch {
        setError("無法連線，請檢查網路");
        return null;
      }
    },
    [eventId],
  );

  /**
   * 掃到之後的第一步：先問後端「這張票是誰的、現在核銷會怎樣」。
   *
   * <p>⭐ 這一步<b>不會改任何狀態</b>。要先讓工作人員看到名字才能確認，
   * 而名字必須在核銷之前就拿得到。
   */
  const previewToken = useCallback(
    async (token: string) => {
      const preview = await post("/preview", token);
      if (!preview) return;

      // ⚠️ 不是「可核銷」就沒有什麼好確認的，直接顯示結果
      if (preview.result !== "SUCCESS") {
        setResult(preview);
        return;
      }
      setPending({ token, preview });
    },
    [post],
  );

  /** 工作人員按下「確認核銷」才真的改狀態 */
  const confirmCheckIn = useCallback(async () => {
    if (!pending) return;
    setSubmitting(true);
    const done = await post("", pending.token);
    setSubmitting(false);
    setPending(null);
    // ⚠️ 這裡的結果才是權威的 —— 預覽到確認之間，
    // 別的工作人員可能已經搶先核銷了
    if (done) setResult(done);
  }, [pending, post]);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      // ⚠️ 沒在掃描時 stop() 會拋錯，所以包起來
      await scanner.stop();
    } catch {
      // 已經停了，忽略
    }
    scanner.clear();
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    lockedRef.current = false;

    // ⚠️ getUserMedia 只在安全內容下可用。區網 IP（http://10.x.x.x:3000）
    // 一定失敗，必須走 https 或 localhost
    if (!window.isSecureContext) {
      setError("相機需要 HTTPS 才能使用。請透過 https 網址開啟這一頁（例如 ngrok）。");
      return;
    }

    const scanner = new Html5Qrcode(READER_ELEMENT_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        // ⚠️ 掃票要用後鏡頭
        { facingMode: "environment" },
        {
          fps: 10,
          // ⭐ qrbox 用函式而不是寫死的 250 —— 寫死的話，
          // 容器比它窄時（直立的手機）掃描框會超出取景範圍，
          // 變成「看得到畫面但怎麼對準都掃不到」
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const edge = Math.floor(
              Math.min(viewfinderWidth, viewfinderHeight) * 0.75,
            );
            return { width: edge, height: edge };
          },
        },
        (decoded) => {
          // ⭐ 立刻上鎖，否則同一張 QR 會在這一瞬間送出好幾次
          if (lockedRef.current) return;
          lockedRef.current = true;
          // 停掉相機再送出 —— 讓工作人員專心看結果，
          // 也避免下一個人的票在他還沒看完時就被掃走
          void stopCamera().then(() => previewToken(decoded));
        },
        undefined, // 每一幀解不出來是常態，不需要處理
      );
      setScanning(true);
    } catch {
      // 使用者拒絕權限、或這台裝置沒有相機
      setError("無法開啟相機。請確認已允許相機權限，或改用下方的手動輸入。");
      scannerRef.current = null;
    }
  }, [stopCamera, previewToken]);

  // ⚠️ 離開頁面一定要關相機 —— 不關的話鏡頭指示燈會一直亮著
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      scanner
        .stop()
        .catch(() => {})
        .finally(() => scanner.clear());
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* html5-qrcode 會把 <video> 塞進這個元素。
          ⚠️ 這個 div 必須一直存在而且**不能加 hidden**：
          start() 會量它的寬度來決定影像尺寸與掃描框大小，
          display:none 時量到的是 0 —— 結果是「相機開了但畫面很小、怎麼對都掃不到」。
          沒在掃描時它本來就是空的，高度自然為 0，不需要藏。

          ⚠️ [&_video]:w-full —— 函式庫塞進來的 <video> 是它自己算的固定寬度，
          手機上常常比容器窄很多。用 Tailwind 的任意變體強制填滿 */}
      <div
        id={READER_ELEMENT_ID}
        className="overflow-hidden rounded-[10px] [&_video]:w-full [&_video]:rounded-[10px]"
      />

      {!scanning && (
        <button
          type="button"
          onClick={startCamera}
          className="rounded-[10px] bg-brand px-6 py-3 text-[18px] text-white transition-colors duration-[350ms] hover:bg-brand-hover"
        >
          {result ? "掃下一張" : "開啟相機掃描"}
        </button>
      )}

      {scanning && (
        <button
          type="button"
          onClick={stopCamera}
          className="rounded-[10px] border border-[#d9d9d9] px-6 py-3 text-ink-soft transition-colors duration-[350ms] hover:border-brand"
        >
          停止掃描
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-[10px] bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {result && <CheckInResult result={result} />}

      {pending && (
        <ConfirmDialog
          preview={pending.preview}
          submitting={submitting}
          onConfirm={confirmCheckIn}
          onCancel={() => setPending(null)}
        />
      )}

      {/* ⚠️ 手動輸入不是多餘的：現場相機壞掉、權限打不開、裝置太舊的時候，
          它是唯一能繼續驗票的路。成本只有幾行 */}
      <details className="rounded-[10px] bg-[#f7f9f9] p-4">
        <summary className="cursor-pointer text-[15px] text-ink-soft">
          相機不能用？手動輸入票券代碼
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualToken.trim()) {
              // 手動輸入也走同一條確認流程
              void previewToken(manualToken.trim());
              setManualToken("");
            }
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="貼上票券代碼"
            aria-label="票券代碼"
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[10px] bg-brand-teal px-5 py-2 text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover"
          >
            核銷
          </button>
        </form>
      </details>
    </div>
  );
}

/**
 * 「確認核銷 XXX 的一般票嗎」。
 *
 * ⭐ 用原生 <dialog> + showModal()：焦點鎖在對話框內、Esc 關閉、
 * 渲染在 top layer 都是免費的（同票券 QR 那個 modal）。
 *
 * ⚠️ 這個對話框刻意<b>不能</b>點背景關閉 —— 核銷是不可逆的動作，
 * 誤觸背景就取消掉會讓工作人員要重掃一次。只能按明確的按鈕。
 */
function ConfirmDialog({
  preview,
  submitting,
  onConfirm,
  onCancel,
}: {
  preview: CheckInResponse;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="check-in-confirm-title"
      className="m-auto rounded-[10px] p-0 backdrop:bg-black/60"
      // ⚠️ Esc 也要走 onCancel，否則對話框關了但 pending 還在，
      // 畫面會卡在「看不到對話框卻也不能繼續掃」的狀態
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onCancel();
      }}
    >
      <div className="flex w-[min(90vw,340px)] flex-col gap-4 p-6">
        <h2
          id="check-in-confirm-title"
          className="text-[20px] font-medium text-ink-soft"
        >
          確認核銷
        </h2>

        <div className="rounded-[10px] bg-[#f7f9f9] p-4">
          <p className="text-[22px] font-medium text-ink">
            {preview.attendeeName}
          </p>
          <p className="text-[16px] text-ink-soft">{preview.ticketTypeName}</p>
        </div>

        <p className="text-[14px] text-ink-muted">
          ⚠️ 核銷之後不能復原，這張票將無法再次入場。
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-[10px] border border-[#d9d9d9] py-3 text-ink-soft transition-colors duration-[350ms] hover:border-brand disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-[10px] bg-brand-teal py-3 font-medium text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover disabled:opacity-50"
          >
            {submitting ? "核銷中…" : "確認核銷"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * 核銷結果。⭐ 用顏色分三級 —— 現場的人是站著、匆忙地看這一眼，
 * 顏色比文字先傳達訊息。
 */
function CheckInResult({ result }: { result: CheckInResponse }) {
  const style = {
    SUCCESS: { box: "bg-brand-teal text-white", label: "✓ 核銷成功" },
    ALREADY_USED: { box: "bg-brand-amber text-ink", label: "⚠ 這張票已經用過了" },
    VOID: { box: "bg-brand-amber text-ink", label: "⚠ 這張票已作廢" },
    INVALID: { box: "bg-red-600 text-white", label: "✕ 無效的票券" },
  }[result.result];

  return (
    // role="status" 而不是 alert：alert 會打斷螢幕閱讀器，
    // 而這是每掃一次都會出現的常態結果
    <div role="status" className={`rounded-[10px] p-5 ${style.box}`}>
      <p className="text-[22px] font-medium">{style.label}</p>

      {result.attendeeName && (
        <p className="mt-2 text-[18px]">
          {result.attendeeName}
          <span className="ml-2 opacity-80">{result.ticketTypeName}</span>
        </p>
      )}

      {result.result === "ALREADY_USED" && (
        <p className="mt-1 text-[15px] opacity-80">
          {result.usedAt
            ? `上次核銷：${formatEventDateTime(result.usedAt)}`
            : "剛剛才被核銷"}
        </p>
      )}
    </div>
  );
}
