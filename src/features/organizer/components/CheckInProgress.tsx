import type { CheckInProgressResponse } from "@/lib/api-types";

/**
 * 核銷進度：「已入場 120 / 300」，並拆到票種。
 *
 * ⭐ 這是純渲染的 Server Component，<b>刻意沒有自己的 state</b>。
 * 掃完一張之後由 CheckInScanner 呼叫 router.refresh()，
 * 整頁的 Server Component 重跑、新的數字直接流下來。
 * 若改成 client component 把 progress 存進 useState，
 * refresh 後的新 prop 會被 state 蓋掉 —— 畫面永遠停在第一次載入的數字，
 * 而且看起來完全正常。
 */
export function CheckInProgress({
  progress,
}: {
  progress: CheckInProgressResponse;
}) {
  const { checkedIn, expected, voided, byTicketType } = progress;

  return (
    <section
      aria-labelledby="check-in-progress-title"
      className="rounded-[10px] bg-[#f7f9f9] p-5"
    >
      <h2
        id="check-in-progress-title"
        className="text-[15px] text-ink-muted"
      >
        入場進度
      </h2>

      {/* ⚠️ 分母是「應到人數」不是「賣出張數」—— 退掉的票不算 */}
      <p className="mt-1 text-[32px] leading-tight font-medium text-ink">
        {checkedIn}
        <span className="text-[20px] text-ink-muted"> / {expected}</span>
      </p>

      <ProgressBar checkedIn={checkedIn} expected={expected} />

      {voided > 0 && (
        <p className="mt-2 text-[14px] text-ink-muted">
          另有 {voided} 張已作廢，未計入應到人數
        </p>
      )}

      {/* 只有一個票種時不用拆 —— 拆出來的數字跟上面一模一樣，只是噪音 */}
      {byTicketType.length > 1 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-[#e4e9e9] pt-4">
          {byTicketType.map((ticketType) => (
            <li
              key={ticketType.ticketTypeId}
              className="flex items-baseline justify-between gap-4 text-[15px]"
            >
              <span className="min-w-0 truncate text-ink-soft">
                {ticketType.name}
              </span>
              <span className="shrink-0 tabular-nums text-ink-muted">
                {ticketType.checkedIn} / {ticketType.expected}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * ⚠️ expected 為 0 時不能拿去做除數 —— 一張都還沒賣的活動會得到 NaN，
 * 而 style={{ width: "NaN%" }} 不會報錯，只是安靜地不套用寬度。
 */
function ProgressBar({
  checkedIn,
  expected,
}: {
  checkedIn: number;
  expected: number;
}) {
  const percent = expected === 0 ? 0 : Math.round((checkedIn / expected) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={checkedIn}
      aria-valuemin={0}
      aria-valuemax={expected}
      aria-label={`已入場 ${checkedIn} 人，應到 ${expected} 人`}
      className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4e9e9]"
    >
      <div
        className="h-full rounded-full bg-brand-teal transition-[width] duration-[350ms]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
