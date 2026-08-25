"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ApiError } from "@/lib/api-types";

/**
 * ⚠️ 後端 ChangePasswordRequest 的第二份規則。
 *
 * ⚠️ currentPassword 只檢查非空，不檢查長度 —— 它是拿去比對舊 hash 的，
 * 不是要設定的新值。加上長度限制會讓「密碼規則變嚴之前註冊的老帳號」
 * 在前端就被擋住、連送出的機會都沒有。後端也是同樣的處理。
 */
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "請輸入目前的密碼"),
    newPassword: z.string().min(8, "密碼至少 8 個字元"),
    confirmPassword: z.string().min(1, "請再次輸入新密碼"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "兩次輸入的新密碼不一致",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ⚠️ confirmPassword 不送出 —— 它純粹是防打錯的前端欄位，
        // 後端沒有這個欄位，送過去只會被忽略
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!res.ok) {
        // 400 = 目前密碼不正確或新密碼不合規；409 = 第三方帳號沒有密碼。
        // ⚠️ 這些規則只寫在後端一處，訊息直接顯示出來
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "修改失敗，請稍後再試");
        return;
      }

      setDone(true);
      // ⚠️ 密碼欄位一定要清掉，不要留在畫面上
      reset();
    } catch {
      setError("無法連線，請檢查網路");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <PasswordField
        id="currentPassword"
        label="目前的密碼"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        register={register("currentPassword")}
      />
      <PasswordField
        id="newPassword"
        label="新密碼"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        register={register("newPassword")}
      />
      <PasswordField
        id="confirmPassword"
        label="確認新密碼"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        register={register("confirmPassword")}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-brand-teal">
          密碼已更新。其他裝置需要重新登入。
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
      >
        {isSubmitting ? "更新中…" : "更新密碼"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  error,
  register,
}: {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<PasswordFormValues>>["register"]>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[15px] font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={!!error}
        {...register}
        className={`rounded border px-3 py-2 outline-none focus:border-brand ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
