"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, inputClass } from "./Field";
import { taipeiLocalToInstant } from "@/lib/event-form-schema";
import type { ApiError, TicketTypeResponse } from "@/lib/api-types";

/**
 * ⚠️ 這是後端 CreateTicketTypeRequest 的第二份規則，理由同 eventFormSchema。
 *
 * ⚠️ price / capacity 的轉型交給 RHF 的 valueAsNumber，**不要用 z.coerce**：
 * z.coerce.number() 對空字串會給 0（Number("") === 0），
 * 票價留白就會靜默變成免費票。valueAsNumber 給的是 NaN，z.number() 會擋下來。
 */
const ticketTypeSchema = z
  .object({
    name: z.string().trim().min(1, "請填寫票種名稱").max(255),
    description: z.string().trim().max(1000).optional(),
    price: z
      .number({ error: "請填寫票價" })
      .min(0, "票價不能為負數")
      .max(99999999, "票價過高"),
    capacity: z
      .number({ error: "請填寫票券總量" })
      .int("票券總量必須是整數")
      .min(1, "票券總量至少為 1"),
    saleStartAt: z.string().optional(),
    saleEndAt: z.string().optional(),
  })
  // 兩個都有填時才比較 —— 販售期間是選填的
  .refine(
    (data) =>
      !data.saleStartAt || !data.saleEndAt || data.saleEndAt > data.saleStartAt,
    { message: "販售結束必須晚於開始", path: ["saleEndAt"] },
  );

type TicketTypeFormValues = z.infer<typeof ticketTypeSchema>;

export function TicketTypeSection({
  eventId,
  ticketTypes,
}: {
  eventId: number;
  ticketTypes: TicketTypeResponse[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketTypeFormValues>({
    resolver: zodResolver(ticketTypeSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: TicketTypeFormValues) => {
    setError(null);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          price: values.price,
          capacity: values.capacity,
          // 販售期間是選填。有填才轉，而且一樣當成台北時間
          saleStartAt: values.saleStartAt
            ? taipeiLocalToInstant(values.saleStartAt)
            : null,
          saleEndAt: values.saleEndAt
            ? taipeiLocalToInstant(values.saleEndAt)
            : null,
        }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "新增失敗，請稍後再試");
        return;
      }

      reset();
      // 票種清單是 Server Component 取的，要 refresh 才會看到新的那一筆
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    }
  };

  const handleDelete = async (ticketTypeId: number) => {
    setError(null);
    setDeletingId(ticketTypeId);
    try {
      const res = await fetch(
        `/api/organizer/events/${eventId}/ticket-types/${ticketTypeId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const apiError: ApiError = await res.json();
        // ⚠️ 「已有訂單購買此票種」的判斷只寫在後端一處 ——
        // 前端不知道有沒有訂單，也不該自己猜。一律顯示刪除鈕，
        // 按下去若被拒絕就把後端的訊息顯示出來
        setError(apiError.message ?? "刪除失敗");
        return;
      }
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {ticketTypes.length === 0 ? (
        <p className="rounded-[10px] bg-[#f7f9f9] p-6 text-center text-ink-muted">
          還沒有票種。⚠️ 活動至少要有一個票種才能發布。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ticketTypes.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#d9d9d9] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-soft">{ticket.name}</p>
                {ticket.description && (
                  <p className="text-[14px] text-ink-muted">
                    {ticket.description}
                  </p>
                )}
              </div>
              <p className="text-[16px] font-bold text-brand-amber">
                NT$ {ticket.price.toLocaleString("zh-TW")}
              </p>
              <p className="text-[14px] text-ink-muted">
                剩 {ticket.stock} / {ticket.capacity}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(ticket.id)}
                disabled={deletingId === ticket.id}
                className="text-[14px] text-red-600 transition-opacity duration-[350ms] hover:opacity-70 disabled:opacity-40"
              >
                {deletingId === ticket.id ? "刪除中…" : "刪除"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4 rounded-[10px] bg-[#f7f9f9] p-4"
      >
        <h3 className="text-[16px] font-medium text-ink-soft">新增票種</h3>

        <Field label="票種名稱" htmlFor="tt-name" error={errors.name?.message}>
          <input
            id="tt-name"
            {...register("name")}
            className={inputClass(!!errors.name)}
            placeholder="例如：單人體驗票"
          />
        </Field>

        <Field
          label="票種說明"
          htmlFor="tt-description"
          hint="（選填）"
          error={errors.description?.message}
        >
          <input
            id="tt-description"
            {...register("description")}
            className={inputClass(!!errors.description)}
            placeholder="例如：含吉他租借"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="票價" htmlFor="tt-price" error={errors.price?.message}>
            <input
              id="tt-price"
              type="number"
              step="1"
              min="0"
              {...register("price", { valueAsNumber: true })}
              className={inputClass(!!errors.price)}
            />
          </Field>

          <Field
            label="票券總量"
            htmlFor="tt-capacity"
            error={errors.capacity?.message}
          >
            <input
              id="tt-capacity"
              type="number"
              step="1"
              min="1"
              {...register("capacity", { valueAsNumber: true })}
              className={inputClass(!!errors.capacity)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="開始販售"
            htmlFor="tt-saleStartAt"
            hint="（選填・台北時間）"
            error={errors.saleStartAt?.message}
          >
            <input
              id="tt-saleStartAt"
              type="datetime-local"
              {...register("saleStartAt")}
              className={inputClass(!!errors.saleStartAt)}
            />
          </Field>

          <Field
            label="停止販售"
            htmlFor="tt-saleEndAt"
            hint="（選填・台北時間）"
            error={errors.saleEndAt?.message}
          >
            <input
              id="tt-saleEndAt"
              type="datetime-local"
              {...register("saleEndAt")}
              className={inputClass(!!errors.saleEndAt)}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-[10px] bg-brand-teal px-5 py-2 text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover disabled:opacity-50"
        >
          {isSubmitting ? "新增中…" : "新增票種"}
        </button>
      </form>
    </div>
  );
}
