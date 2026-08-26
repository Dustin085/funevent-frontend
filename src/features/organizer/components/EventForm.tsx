"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Field, inputClass } from "./Field";
import {
  eventFormSchema,
  instantToTaipeiLocal,
  taipeiLocalToInstant,
  type EventFormValues,
} from "@/lib/event-form-schema";
import { isAllowedImageUrl } from "@/lib/image-hosts";
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
  onCancel,
  onSaved,
}: {
  categories: CategoryResponse[];
  cities: CityResponse[];
  /** 有值就是編輯模式，沒有就是建立 */
  event?: EventResponse;
  /** 有給就渲染「取消」按鈕。⚠️ 兩個 callback 都不給時行為完全不變（建立活動頁） */
  onCancel?: () => void;
  /** 編輯儲存成功後呼叫，讓外層切回唯讀檢視 */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEdit = event !== undefined;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    // ⚠️ 預設是 onSubmit（按下送出才驗）。九個欄位的表單等到最後
    // 一次噴出五個錯誤很傷；onBlur 是離開欄位就驗 —— 比 onChange 溫和，
    // 打字打到一半不會被紅字追著跑
    mode: "onBlur",
    // ⚠️ imageUrls 要拉到展開之外：建立模式時 event 是 undefined，
    // 整個 defaultValues 會是 undefined，useFieldArray 就沒有初始值。
    // 其餘欄位維持「只有編輯模式才給預設值」的原本行為
    defaultValues: {
      ...(event && {
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
      }),
      // string[] → {url}[]，見 schema 裡的說明
      imageUrls: event?.imageUrls.map((url) => ({ url })) ?? [],
    },
  });

  const images = useFieldArray({ control, name: "imageUrls" });
  // 縮圖要即時反映使用者貼上的網址，所以要 watch 而不是讀 fields
  //（fields 只是掛載當下的快照，之後不會跟著輸入變動）
  const imageValues = watch("imageUrls");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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
            // ⚠️ {url}[] → string[]。轉型集中在「送給 API」這個邊界上，
            // 表單狀態裡維持 useFieldArray 需要的物件形狀
            imageUrls: values.imageUrls.map((image) => image.url),
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
        // refresh 讓 Server Component 重新取資料，標題與唯讀檢視才會同步
        router.refresh();
        if (onSaved) {
          // 切回唯讀。⚠️ 這裡不設 saved —— 元件馬上會被卸載，
          // 設了也沒人看得到，而唯讀檢視本身就是「存好了」的證據
          onSaved();
        } else {
          setSaved(true);
        }
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

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[15px] font-medium text-ink-soft">
          活動圖片
          <span className="ml-1 font-normal text-ink-muted">
            （選填，最多 10 張，第一張是封面）
          </span>
        </legend>

        {images.fields.length === 0 && (
          <p className="text-[14px] text-ink-muted">
            還沒有圖片。可以到 Unsplash 找圖，
            <strong>在圖片上按右鍵「複製圖片位址」</strong>
            貼進來（網頁網址不行，要 images.unsplash.com 開頭的那個）。
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {images.fields.map((field, index) => (
            <li
              key={field.id}
              // ⚠️ 整列當放置目標，但只有把手是 draggable ——
              // 整列都 draggable 的話輸入框裡的文字就選不起來了
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingIndex !== null && draggingIndex !== index) {
                  images.move(draggingIndex, index);
                }
                setDraggingIndex(null);
              }}
              className={`flex items-center gap-2 rounded-[10px] border p-2 transition-colors duration-[350ms] ${
                draggingIndex === index
                  ? "border-brand bg-[#f7f9f9]"
                  : "border-[#d9d9d9]"
              }`}
            >
              <span
                draggable
                onDragStart={() => setDraggingIndex(index)}
                onDragEnd={() => setDraggingIndex(null)}
                aria-hidden
                title="拖曳排序"
                className="cursor-grab px-1 text-ink-muted select-none active:cursor-grabbing"
              >
                ⠿
              </span>

              {/* 縮圖。⚠️ 一定要先過 isAllowedImageUrl：打字打到一半的網址
                  是常態，而 next/image 對不合法的 src 是**拋錯**，
                  會讓整個表單當場掛掉 */}
              {isAllowedImageUrl(imageValues?.[index]?.url) ? (
                <Image
                  src={imageValues[index].url}
                  alt=""
                  width={64}
                  height={48}
                  aria-hidden
                  unoptimized
                  className="h-12 w-16 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="h-12 w-16 shrink-0 rounded bg-[#f7f9f9]" />
              )}

              <div className="min-w-0 flex-1">
                <input
                  {...register(`imageUrls.${index}.url`)}
                  placeholder="https://images.unsplash.com/photo-..."
                  aria-label={`第 ${index + 1} 張圖片的網址`}
                  className={inputClass(!!errors.imageUrls?.[index]?.url)}
                />
                {index === 0 && (
                  <p className="mt-1 text-[13px] text-brand-teal">封面</p>
                )}
                {errors.imageUrls?.[index]?.url && (
                  <p role="alert" className="mt-1 text-sm text-red-600">
                    {errors.imageUrls[index]?.url?.message}
                  </p>
                )}
              </div>

              {/* ⚠️ 上下移動不是多餘的：HTML5 拖曳在觸控裝置上不會觸發，
                  鍵盤使用者也拖不動。這兩顆才是所有人都能用的排序方式 */}
              <button
                type="button"
                onClick={() => images.move(index, index - 1)}
                disabled={index === 0}
                aria-label={`把第 ${index + 1} 張往前移`}
                className="px-1 text-ink-muted transition-colors duration-[350ms] hover:text-brand disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => images.move(index, index + 1)}
                disabled={index === images.fields.length - 1}
                aria-label={`把第 ${index + 1} 張往後移`}
                className="px-1 text-ink-muted transition-colors duration-[350ms] hover:text-brand disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => images.remove(index)}
                aria-label={`移除第 ${index + 1} 張`}
                className="px-1 text-[14px] text-red-600 transition-opacity duration-[350ms] hover:opacity-70"
              >
                移除
              </button>
            </li>
          ))}
        </ul>

        {images.fields.length < 10 && (
          <button
            type="button"
            onClick={() => images.append({ url: "" })}
            className="self-start rounded-[10px] border border-[#d9d9d9] px-4 py-2 text-[15px] text-ink-soft transition-colors duration-[350ms] hover:border-brand"
          >
            ＋ 新增圖片
          </button>
        )}
      </fieldset>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
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

        {/* ⚠️ 底下每個按鈕都要寫 type="button"：在 <form> 裡沒指定 type 的
            button 預設是 submit，按「取消」會變成送出表單 */}
        {onCancel &&
          (confirmingCancel ? (
            <>
              <span className="text-sm text-ink-muted">尚未儲存，確定放棄？</span>
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                className="text-sm text-ink-soft transition-opacity duration-[350ms] hover:opacity-70"
              >
                繼續編輯
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="text-sm font-medium text-red-600 transition-opacity duration-[350ms] hover:opacity-70"
              >
                放棄
              </button>
            </>
          ) : (
            <button
              type="button"
              // 沒改過就直接離開；改過才問一次 ——
              // 九個欄位的表單誤觸一下全部丟掉太痛
              onClick={() => (isDirty ? setConfirmingCancel(true) : onCancel())}
              disabled={isSubmitting}
              className="rounded-[10px] border border-[#d9d9d9] px-6 py-2.5 text-ink-soft transition-colors duration-[350ms] hover:border-brand disabled:opacity-50"
            >
              取消
            </button>
          ))}

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
