"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api-types";

/** 後端一個欄位可能同時違反多條規則（空字串會同時觸發 @NotBlank 和 @Size） */
type FieldErrors = Record<string, string[]>;

export function RegisterForm({ next = "/" }: { next?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  /** 整體錯誤：409 email 重複、502 連不上… */
  const [error, setError] = useState<string | null>(null);
  /** 欄位層級錯誤：400 @Valid 驗證失敗 */
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  /**
   * ⚠️ 和 fieldErrors 分開：那個是後端回來的，這個純粹是前端防打錯。
   * 後端的 RegisterRequest 根本沒有 confirmPassword 這個欄位
   */
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // 使用者一開始修正就把紅字清掉，不要讓它在已經正確的輸入旁邊繼續掛著
  const updatePassword = (value: string) => {
    setPassword(value);
    setConfirmError(null);
  };
  const updateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setConfirmError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      // ⚠️ 連 API 都不用打 —— 這是純前端的欄位，後端無從驗證
      setConfirmError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});
    setConfirmError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
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

        setError(apiError.message ?? "註冊失敗，請稍後再試");
        return;
      }

      // 註冊成功。後端的 register 不簽發 token，所以導到登入頁 ——
      // 把 next 帶過去，登入完才會回到使用者原本想去的地方
      router.push(`/login?next=${encodeURIComponent(next)}`);
      router.refresh();
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Field
        id="email"
        label="電子信箱"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        errors={fieldErrors.email}
      />
      <Field
        id="password"
        label="密碼"
        type="password"
        value={password}
        onChange={updatePassword}
        autoComplete="new-password"
        errors={fieldErrors.password}
      />
      {/* ⚠️ 這個值不會送給後端，它只是防打錯 ——
          註冊時打錯密碼的話，使用者要等到下次登入才會發現 */}
      <Field
        id="confirmPassword"
        label="確認密碼"
        type="password"
        value={confirmPassword}
        onChange={updateConfirmPassword}
        autoComplete="new-password"
        errors={confirmError ? [confirmError] : undefined}
      />
      <Field
        id="name"
        label="姓名"
        type="text"
        value={name}
        onChange={setName}
        autoComplete="name"
        errors={fieldErrors.name}
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
        {loading ? "註冊中..." : "註冊"}
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
        className={`rounded border bg-surface px-3 py-2 outline-none focus:border-brand ${
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
