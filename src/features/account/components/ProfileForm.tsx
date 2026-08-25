"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ApiError } from "@/lib/api-types";

/** ⚠️ 後端 UpdateProfileRequest 的第二份規則。Java 的驗證沒辦法共享給 TypeScript */
const profileFormSchema = z.object({
  name: z.string().trim().min(1, "名字不可為空").max(50, "名字長度不可超過 50 字元"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      });

      if (!res.ok) {
        const apiError: ApiError = await res.json();
        setError(apiError.message ?? "儲存失敗，請稍後再試");
        return;
      }

      setSaved(true);
      // Topbar 的「你好，某某」是 Server Component 渲染的，refresh 才會跟著更新
      router.refresh();
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
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-[15px] font-medium text-ink-soft">
          名字
        </label>
        <input
          id="name"
          {...register("name")}
          autoComplete="name"
          aria-invalid={!!errors.name}
          className={`rounded border px-3 py-2 outline-none focus:border-brand ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.name && (
          <p role="alert" className="text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-brand-teal">
          已儲存
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
      >
        {isSubmitting ? "儲存中…" : "儲存"}
      </button>
    </form>
  );
}
