"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  ApiError,
  OrderResponse,
  TicketTypeResponse,
} from "@/lib/api-types";

export type TicketTypeOption = TicketTypeResponse & {
  /** 由 Server Component 算好，null 代表可購買 */
  unavailableReason: string | null;
};

/**
 * 從舊專案 event.html 的 .event-plan-board 移植。
 *
 * 舊設計是「選一個方案 + 一個數量」；我們的訂單模型是多個票種各自選數量
 * （CreateOrderRequest.items[]），所以改成一列一個票種。
 * 時段與 Fun 點數移除 —— 後端沒有這些概念。
 *
 * 這是 Client Component：數量是本地互動狀態，必須在瀏覽器端維護。
 * 但它不直接打 Spring —— AT 是 httpOnly，前端 JS 讀不到，
 * 一律經過 BFF 的 /api/orders。
 */
export function TicketTypePicker({
  eventId,
  options,
}: {
  eventId: number;
  options: TicketTypeOption[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = options.reduce(
    (sum, option) => sum + option.price * (quantities[option.id] ?? 0),
    0,
  );
  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const change = (option: TicketTypeOption, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[option.id] ?? 0) + delta;
      // 上限用 stock：後端仍會用條件式 UPDATE 再擋一次，
      // 前端這層只是避免使用者白跑一趟
      const clamped = Math.min(Math.max(next, 0), option.stock);
      return { ...prev, [option.id]: clamped };
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticketTypeId: Number(ticketTypeId),
        quantity,
      }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.status === 401) {
        // 未登入 —— 帶上原路徑，登入完可以導回來。
        // 路徑當作 query 值一定要編碼，否則之後出現 ? 或 & 會截斷
        router.push(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
        return;
      }
      if (!res.ok) {
        const body: ApiError = await res.json();
        // 409 多半是「剩餘票券不足」—— 別人剛好搶先了
        setError(body.message ?? "下單失敗，請稍後再試");
        return;
      }

      const order: OrderResponse = await res.json();
      router.push(`/orders/${order.id}`);
    } catch {
      setError("無法連線到伺服器，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[35px] funevent-shadow">
      <p className="text-[20px] font-medium text-ink-soft">選擇票種</p>

      {options.length === 0 ? (
        <p className="text-ink-muted">此活動尚未開放票種</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {options.map((option) => {
            const quantity = quantities[option.id] ?? 0;
            const disabled = option.unavailableReason !== null;
            return (
              <li
                key={option.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-medium text-ink-soft">
                    {option.name}
                  </p>
                  <p className="text-[16px] text-ink-muted">
                    NT$ {option.price.toLocaleString("zh-TW")}
                    {disabled ? (
                      <span className="ml-2 text-brand-hover">
                        {option.unavailableReason}
                      </span>
                    ) : (
                      <span className="ml-2">剩 {option.stock}</span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center">
                  <StepButton
                    icon="/images/minus-icon.svg"
                    label={`減少 ${option.name}`}
                    disabled={disabled || quantity <= 0}
                    onClick={() => change(option, -1)}
                  />
                  <p className="mx-5 w-6 text-center text-[24px] font-medium text-ink-soft">
                    {quantity}
                  </p>
                  <StepButton
                    icon="/images/plus-icon.svg"
                    label={`增加 ${option.name}`}
                    disabled={disabled || quantity >= option.stock}
                    onClick={() => change(option, 1)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="h-px w-full bg-[#d9d9d9]" />

      <div className="flex items-center justify-between">
        <p className="text-[20px] font-medium text-ink-soft">總金額</p>
        <p className="text-[20px] font-medium text-ink-soft">
          NT$ {totalAmount.toLocaleString("zh-TW")}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-[16px] text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={totalCount === 0 || submitting}
        className="flex h-[46px] items-center justify-center rounded-[10px] bg-brand text-[18px] text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "處理中…" : "立即報名"}
      </button>
    </section>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="transition-transform duration-[350ms] hover:scale-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
    >
      <Image src={icon} alt="" width={24} height={24} aria-hidden />
    </button>
  );
}
