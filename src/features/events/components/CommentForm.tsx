"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ApiError } from "@/lib/api-types";

/**
 * ⚠️ 後端 CreateCommentRequest 的第二份規則（rating 1–5、content ≤ 2000）。
 * Java 的驗證沒辦法共享給 TypeScript，這個重複是刻意接受的。
 */
const RATING_VALUES = ["1", "2", "3", "4", "5"] as const;

/**
 * ⚠️ rating 用字串列舉，不是 z.number()。
 *
 * radio 的 value 在 DOM 裡**本來就是字串** —— register 的 valueAsNumber 是
 * <input type="number"> 的功能，對 radio 完全沒有作用，RHF 會照原樣給 "3"，
 * 於是 z.number() 直接拒絕、畫面顯示「請選擇評分」。
 *
 * ⚠️ 而星星的填色看起來是正常的，因為 1 <= "3" 在 JS 裡會隱式轉型成 true。
 * 視覺全對、驗證全錯 —— 這種一半一半的狀況最難查。
 *
 * 用列舉承認「DOM 給的是字串」，轉成數字留到送出那一刻（送 API 的邊界）。
 * 不用 z.coerce 的理由和票價那邊一樣：coerce 會把非預期的輸入悄悄變成數字。
 */
const commentFormSchema = z.object({
  rating: z.enum(RATING_VALUES, { error: "請選擇評分" }),
  content: z.string().trim().max(2000, "評論最多 2000 字").optional(),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

export function CommentForm({ eventId }: { eventId: number }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
  });

  // 星星要「填到目前選的那一顆」，所以需要即時值。
  // 是字串（"3"），比較前要轉數字 —— 不轉的話 JS 會隱式轉型「剛好」也對，
  // 但那是碰巧不是設計
  const rating = Number(watch("rating") ?? 0);

  const onSubmit = async (values: CommentFormValues) => {
    setError(null);
    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 轉型放在「送給 API」這個邊界上，而不是散在表單狀態裡
          rating: Number(values.rating),
          // 空字串送 null —— 後端的 content 是可為 null 的 TEXT
          content: values.content || null,
        }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();
        // 403 = 沒買票或活動還沒開始；409 = 已經評過了。
        // ⚠️ 這些規則只寫在後端一處，訊息直接顯示出來
        setError(apiError.message ?? "送出失敗，請稍後再試");
        return;
      }

      setSubmitted(true);
      // 評分摘要與評論列表都是 Server Component 取的，refresh 才會看到自己那則
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    }
  };

  if (submitted) {
    return (
      <p
        role="status"
        className="rounded-[10px] bg-[#f7f9f9] p-6 text-center text-ink-soft"
      >
        感謝你的評論！
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // noValidate：交給 zod 統一驗證與顯示訊息，
      // 不要讓瀏覽器的原生提示（樣式不可控、文案是英文）跟我們搶
      noValidate
      className="flex flex-col gap-4 rounded-[10px] bg-[#f7f9f9] p-5"
    >
      <h3 className="text-[18px] font-medium text-ink-soft">寫下你的評論</h3>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-medium text-ink-soft">評分</legend>
        {/* ⚠️ 用 radio 而不是一堆 <button>：左右鍵可以在選項間移動、
            螢幕閱讀器會唸「5 個選項中的第 3 個」，而且它本來就是表單欄位 ——
            這些全部是免費的，自己用 button 做要一項一項補回來 */}
        <div className="flex gap-2">
          {RATING_VALUES.map((option) => {
            const value = Number(option);
            return (
              <label key={option} className="cursor-pointer">
                {/* ⚠️ sr-only 不是 hidden —— hidden 的 input 收不到鍵盤焦點 */}
                <input
                  type="radio"
                  value={option}
                  {...register("rating")}
                  className="peer sr-only"
                />
                <Image
                  src={
                    value <= rating
                      ? "/images/rating-icon--filled.svg"
                      : "/images/rating-icon.svg"
                  }
                  alt={`${value} 分`}
                  width={32}
                  height={32}
                  // input 被隱藏了，焦點指示要畫在星星上 ——
                  // 不然鍵盤使用者完全看不出焦點在哪
                  className="rounded transition-transform duration-[350ms] hover:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-brand"
                />
              </label>
            );
          })}
        </div>
        {errors.rating && (
          <p role="alert" className="text-sm text-red-600">
            {errors.rating.message}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="comment-content"
          className="text-[15px] font-medium text-ink-soft"
        >
          評論內容
          <span className="ml-1 font-normal text-ink-muted">（選填）</span>
        </label>
        <textarea
          id="comment-content"
          rows={4}
          {...register("content")}
          placeholder="分享一下這次的體驗，會很有幫助"
          className={`rounded border px-3 py-2 outline-none focus:border-gray-900 ${
            errors.content ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.content && (
          <p role="alert" className="text-sm text-red-600">
            {errors.content.message}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
      >
        {isSubmitting ? "送出中…" : "送出評論"}
      </button>
    </form>
  );
}
