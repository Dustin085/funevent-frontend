"use client";

import { ApiError, MessageResponse } from "@/lib/api-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FieldErrors = Record<string, string[]>;

export function ResetPasswordForm() {
  const router = useRouter();
  const token: string | null = useSearchParams().get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** 整體錯誤：token 失效、502 連不上… */
  const [error, setError] = useState<string | null>(null);
  /** 欄位層級錯誤：400 @Valid 驗證失敗 */
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  /**
   * ⚠️ 和 fieldErrors 分開：那個是後端回來的，這個純粹是前端防打錯。
   * 後端的 ResetPasswordRequest 沒有 confirmPassword 這個欄位
   */
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // 使用者一開始修正就把紅字清掉
  const updateNewPassword = (value: string) => {
    setNewPassword(value);
    setConfirmError(null);
  };
  const updateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setConfirmError(null);
  };

  // 沒有 token 就不用打 API，一定會是 InvalidResetTokenException
  if (!token) {
    return (
      <p role="alert" className="text-sm text-red-600">
        連結無效，請重新申請忘記密碼
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      // ⚠️ 顯示在欄位上而不是整體訊息 —— 錯的是那個欄位，
      // 而且整體訊息區還要留給後端回來的 token 失效之類的錯誤。
      // 連 API 都不用打
      setConfirmError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});
    setConfirmError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();

        // 後端的 errors 陣列 → 依 field 分組。
        // 這就是當初堅持用 List<FieldError> 而非 Map<String, String> 的理由：
        // 同一個欄位可以有多筆訊息，用 Map 會吃掉其中一筆。
        if (apiError.errors?.length) {
          const grouped: FieldErrors = {};
          for (const fe of apiError.errors) {
            (grouped[fe.field] ??= []).push(fe.message);
          }
          setFieldErrors(grouped);
        }

        setError(apiError.message ?? "密碼重設失敗，請重新申請");
        return;
      }

      const data: MessageResponse = await res.json();
      setSuccessMessage(data.message);

      // 給使用者一點時間看到成功訊息,不要立刻跳轉
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  // 成功後不再顯示表單，改顯示後端回傳的訊息
  if (successMessage) {
    return (
      <p role="status" className="text-sm text-ink">
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Field
        id="newPassword"
        label="新密碼"
        type="password"
        value={newPassword}
        onChange={updateNewPassword}
        autoComplete="new-password"
        errors={fieldErrors.newPassword}
      />
      <Field
        id="confirmPassword"
        label="確認密碼"
        type="password"
        value={confirmPassword}
        onChange={updateConfirmPassword}
        autoComplete="new-password"
        errors={confirmError ? [confirmError] : undefined}
      />

      {/* 欄位錯誤已顯示在各欄位下方，這裡只放整體訊息 */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {loading ? "處理中..." : "重設密碼"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  errors,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  errors?: string[];
}) {
  const hasError = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        aria-invalid={hasError}
        className={`rounded border px-3 py-2 outline-none focus:border-brand ${
          hasError ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors?.map((msg) => (
        <p key={msg} className="text-xs text-red-600">
          {msg}
        </p>
      ))}
    </div>
  );
}
