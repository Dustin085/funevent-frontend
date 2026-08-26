"use client";

import { useState } from "react";

/**
 * 「平常顯示、按下編輯才變表單」的共用行為。
 *
 * ⭐ 值得共用的不是那幾行 state，是**行為**：用條件渲染切換（而不是把表單設成
 * disabled），表單每次進入編輯模式都會重新掛載，defaultValues 從最新的 props
 * 重新讀一次 —— 於是「取消」自動等於「丟棄」，各處都不必記得自己呼叫 reset()。
 * 三個地方各寫一次的話，遲早有一份忘記。
 *
 * ⚠️ renderForm 收到的 exit 要在「取消」和「儲存成功」兩處都呼叫。
 */
export function EditableBlock({
  view,
  renderForm,
  editLabel = "編輯",
}: {
  /** 唯讀狀態要顯示的內容 */
  view: React.ReactNode;
  /** 編輯狀態的表單。exit 會切回唯讀 */
  renderForm: (exit: () => void) => React.ReactNode;
  editLabel?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <>{renderForm(() => setEditing(false))}</>;
  }

  return (
    <div className="flex flex-col gap-5">
      {view}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="self-start rounded-[10px] bg-brand px-6 py-2.5 text-white transition-colors duration-[350ms] hover:bg-brand-hover"
      >
        {editLabel}
      </button>
    </div>
  );
}
