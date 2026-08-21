"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClass } from "./Field";
import {
  eventFormSchema,
  instantToTaipeiLocal,
  taipeiLocalToInstant,
  type EventFormValues,
} from "@/lib/event-form-schema";
import type {
  ApiError,
  CategoryResponse,
  CityResponse,
  EventResponse,
} from "@/lib/api-types";

/**
 * 建立活動的表單。
 *
 * ⚠️ 這是全站第一個「沒有 JavaScript 就不能用」的地方。公開頁面（搜尋、篩選、
 * 分頁）全部是原生 GET 表單，刻意維持免 JS；後台打破這個原則是有意識的取捨：
 * 它在登入之後、使用者是主辦者、不需要被爬蟲索引、也不需要分享網址，
 * 而表單複雜度（九個欄位 + 之後的票種陣列）高到手寫 state 會很痛。
 */
export function EventForm({
  categories,
  cities,
  event,
}: {
  categories: CategoryResponse[];
  cities: CityResponse[];
  /** 有值就是編輯模式，沒有就是建立 */
  event?: EventResponse;
}) {
  const router = useRouter();
  const isEdit = event !== undefined;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    // ⚠️ 預設是 onSubmit（按下送出才驗）。九個欄位的表單等到最後
    // 一次噴出五個錯誤很傷；onBlur 是離開欄位就驗 —— 比 onChange 溫和，
    // 打字打到一半不會被紅字追著跑
    mode: "onBlur",
    defaultValues: event && {
      name: event.name,
      description: event.description,
      // ⚠️ UTC → 台北時間。不轉的話編輯時看到的時間會比自己填的少 8 小時
      startAt: instantToTaipeiLocal(event.startAt),
      endAt: instantToTaipeiLocal(event.endAt),
      category: event.categoryCode,
      // ⚠️ 用 cityCode 不是 city —— city 是顯示用的簡稱（「台北」），
      // 拿它去比對 <option value="TAIPEI"> 永遠對不上，select 會變成空的
      city: event.cityCode,
      district: event.district ?? "",
      locationName: event.locationName ?? "",
      address: event.address ?? "",
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    setSubmitError(null);
    setSaved(false);
    try {
      // 相對路徑 → 打自己的 BFF route handler，不是 Spring
      const res = await fetch(
        isEdit ? `/api/organizer/events/${event.id}` : "/api/organizer/events",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            category: values.category,
            city: values.city,
            // 選填欄位空字串要送 null，不然資料庫裡會存進空白字串，
            // 前端的 {value && ...} 判斷就會失效
            district: values.district || null,
            locationName: values.locationName || null,
            address: values.address || null,
            startAt: taipeiLocalToInstant(values.startAt),
            endAt: taipeiLocalToInstant(values.endAt),
          }),
        },
      );

      if (!res.ok) {
        const error: ApiError = await res.json();
        setSubmitError(
          error.message ??
            (isEdit ? "儲存失敗，請稍後再試" : "建立失敗，請稍後再試"),
        );
        return;
      }

      if (isEdit) {
        // 編輯留在原頁 —— 使用者接著多半是要改票種。
        // refresh 讓 Server Component 重新取資料，標題等處才會同步
        setSaved(true);
        router.refresh();
        return;
      }

      const created: EventResponse = await res.json();
      // 剛建好的是草稿、還沒有票種 —— 直接送到編輯頁去加票種，
      // 而不是回列表讓使用者自己找回來
      router.push(`/organizer/events/${created.id}`);
      router.refresh();
    } catch {
      setSubmitError("無法連線，請檢查網路");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // noValidate：交給 zod 統一驗證與顯示訊息，
      // 不要讓瀏覽器的原生提示（樣式不可控、文案是英文）跟我們搶
      noValidate
      className="flex flex-col gap-5"
    >
      <Field label="活動名稱" htmlFor="name" error={errors.name?.message}>
        <input
          id="name"
          {...register("name")}
          className={inputClass(!!errors.name)}
          placeholder="例如：流行音樂與民謠吉他"
        />
      </Field>

      <Field
        label="活動介紹"
        htmlFor="description"
        error={errors.description?.message}
      >
        <textarea
          id="description"
          rows={8}
          {...register("description")}
          className={inputClass(!!errors.description)}
          placeholder="換行會被保留，可以直接分段"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="開始時間"
          htmlFor="startAt"
          error={errors.startAt?.message}
          hint="（台北時間）"
        >
          <input
            id="startAt"
            type="datetime-local"
            {...register("startAt")}
            className={inputClass(!!errors.startAt)}
          />
        </Field>

        <Field
          label="結束時間"
          htmlFor="endAt"
          error={errors.endAt?.message}
          hint="（台北時間）"
        >
          <input
            id="endAt"
            type="datetime-local"
            {...register("endAt")}
            className={inputClass(!!errors.endAt)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="活動分類"
          htmlFor="category"
          error={errors.category?.message}
        >
          <select
            id="category"
            // ⚠️ 不能寫死 defaultValue="" —— 編輯模式下會和 RHF 的
            // defaultValues 打架，select 可能顯示成「請選擇」而不是原本的分類
            defaultValue={event?.categoryCode ?? ""}
            {...register("category")}
            className={inputClass(!!errors.category)}
          >
            <option value="" disabled>
              請選擇
            </option>
            {categories.map((category) => (
              <option key={category.code} value={category.code}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="縣市" htmlFor="city" error={errors.city?.message}>
          <select
            id="city"
            defaultValue={event?.cityCode ?? ""}
            {...register("city")}
            className={inputClass(!!errors.city)}
          >
            <option value="" disabled>
              請選擇
            </option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="鄉鎮市區"
          htmlFor="district"
          hint="（選填）"
          error={errors.district?.message}
        >
          <input
            id="district"
            {...register("district")}
            className={inputClass(!!errors.district)}
            placeholder="例如：中山區"
          />
        </Field>

        <Field
          label="場地名稱"
          htmlFor="locationName"
          hint="（選填）"
          error={errors.locationName?.message}
        >
          <input
            id="locationName"
            {...register("locationName")}
            className={inputClass(!!errors.locationName)}
            placeholder="例如：蘭響音樂教室"
          />
        </Field>
      </div>

      <Field
        label="詳細地址"
        htmlFor="address"
        hint="（選填）"
        error={errors.address?.message}
      >
        <input
          id="address"
          {...register("address")}
          className={inputClass(!!errors.address)}
          placeholder="例如：台北市中山區南京東路二段100號5樓"
        />
      </Field>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="flex items-center gap-3">
        {/* ⚠️ isSubmitting 由 RHF 提供，不用自己開 loading state ——
            只要 onSubmit 回傳 Promise，它會自己追蹤 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover disabled:opacity-50"
        >
          {isSubmitting
            ? isEdit
              ? "儲存中…"
              : "建立中…"
            : isEdit
              ? "儲存變更"
              : "建立活動（草稿）"}
        </button>
        {/* role="status"：成功訊息不像錯誤那麼急，用 polite 的宣告方式 */}
        {saved && !isSubmitting && (
          <p role="status" className="text-sm text-brand-teal">
            已儲存
          </p>
        )}
      </div>
    </form>
  );
}
