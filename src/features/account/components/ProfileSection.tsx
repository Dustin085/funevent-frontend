"use client";

import { EditableBlock } from "@/components/EditableBlock";
import { ProfileForm } from "./ProfileForm";

/**
 * 姓名：平常顯示，按下編輯才變表單。
 *
 * ⭐ 儲存成功直接收合 —— 唯讀狀態顯示的就是新名字，
 * 那本身就是「存好了」的證明，不需要再多一句「已儲存」。
 */
export function ProfileSection({ name }: { name: string }) {
  return (
    <EditableBlock
      view={
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-medium text-ink-soft">姓名</p>
          <p className="text-ink-soft">{name}</p>
        </div>
      }
      renderForm={(exit) => (
        <ProfileForm defaultName={name} onCancel={exit} onSaved={exit} />
      )}
    />
  );
}
