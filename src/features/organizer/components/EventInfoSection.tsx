"use client";

import Image from "next/image";
import { useState } from "react";
import { EventForm } from "./EventForm";
import { formatEventDateTime } from "@/lib/format-date";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import type {
  CategoryResponse,
  CityResponse,
  EventResponse,
} from "@/lib/api-types";

/**
 * 主辦者後台的「活動資訊」：平常是唯讀檢視，按下編輯才變成表單。
 *
 * ⭐ 用條件渲染切換而不是把表單設成 disabled —— 這樣 EventForm 每次進入
 * 編輯模式都會**重新掛載**，RHF 的 defaultValues 會從最新的 event prop
 * 重新讀一次。取消等於丟棄，不需要自己呼叫 reset()。
 */
export function EventInfoSection({
  event,
  categories,
  cities,
}: {
  event: EventResponse;
  categories: CategoryResponse[];
  cities: CityResponse[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EventForm
        event={event}
        categories={categories}
        cities={cities}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <EventInfoView event={event} />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover"
      >
        編輯活動資訊
      </button>
    </div>
  );
}

/** 唯讀檢視。九個欄位全部列出，選填的沒填就顯示「未提供」 */
function EventInfoView({ event }: { event: EventResponse }) {
  // ⚠️ 濾掉不能顯示的網址 —— 白名單外的網域會讓 next/image 拋錯。
  // 舊資料或直接打 API 存進來的網址都可能是這種
  const displayableImages = event.imageUrls.filter(isAllowedImageUrl);

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr]">
      <InfoRow label="活動名稱">{event.name}</InfoRow>

      <InfoRow label="活動介紹">
        {/* description 是純文字（後端是 TEXT），
            whitespace-pre-line 保留主辦者輸入的換行 */}
        <span className="whitespace-pre-line">{event.description}</span>
      </InfoRow>

      <InfoRow label="活動時間">
        {formatEventDateTime(event.startAt)}
        <span className="mx-1">～</span>
        {formatEventDateTime(event.endAt)}
      </InfoRow>

      {/* ⚠️ 顯示用 categoryName / city（簡稱），不是 categoryCode / cityCode ——
          那兩個是給表單的 select 對值用的識別碼 */}
      <InfoRow label="活動分類">{event.categoryName}</InfoRow>

      <InfoRow label="地區">
        {event.city}
        {event.district && ` · ${event.district}`}
      </InfoRow>

      <InfoRow label="場地名稱">{event.locationName}</InfoRow>
      <InfoRow label="詳細地址">{event.address}</InfoRow>

      <InfoRow label="活動圖片">
        {displayableImages.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {displayableImages.map((url, index) => (
              <li key={url} className="relative">
                <Image
                  src={url}
                  alt=""
                  width={96}
                  height={72}
                  aria-hidden
                  className="h-[72px] w-24 rounded object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 rounded-tr rounded-bl bg-brand-teal px-1.5 text-[12px] text-white">
                    封面
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </InfoRow>
    </dl>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // 選填欄位可能是 null、undefined、空字串，
  // ⚠️ 還有 false —— {list.length > 0 && <ul/>} 在清單為空時給的就是 false
  const isEmpty =
    children === null ||
    children === undefined ||
    children === "" ||
    children === false;

  return (
    <>
      <dt className="text-[15px] font-medium whitespace-nowrap text-ink-muted sm:text-right">
        {label}
      </dt>
      <dd className={`text-ink-soft ${isEmpty ? "text-ink-muted" : ""}`}>
        {isEmpty ? "未提供" : children}
      </dd>
    </>
  );
}
