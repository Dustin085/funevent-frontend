"use client";

import { useState } from "react";
import { EditableBlock } from "@/components/EditableBlock";
import { PasswordForm } from "./PasswordForm";

/**
 * 密碼：平常只顯示 ••••••••，按下「修改密碼」才展開表單。
 *
 * ⭐ 收起來不只是為了版面：三個密碼欄位常駐在頁面上，
 * 會招來瀏覽器與密碼管理員的自動填入，而那是一件很少做的事。
 *
 * ⚠️ 和姓名不同，密碼收合後畫面上只剩 ••••••••，看不出剛才成功了 ——
 * 所以成功訊息要留在唯讀狀態顯示。而且那句話很重要：
 * 使用者需要知道自己剛把其他裝置登出了。
 */
export function PasswordSection() {
  const [justChanged, setJustChanged] = useState(false);

  return (
    <EditableBlock
      editLabel="修改密碼"
      view={
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-medium text-ink-soft">密碼</p>
          {/* 密碼沒有「顯示」這回事，用圓點表示「有設定」 */}
          <p className="tracking-[0.2em] text-ink-muted">••••••••</p>
          {justChanged && (
            <p role="status" className="mt-1 text-sm text-brand-teal">
              密碼已更新。其他裝置需要重新登入。
            </p>
          )}
        </div>
      }
      renderForm={(exit) => (
        <PasswordForm
          onCancel={exit}
          onSaved={() => {
            setJustChanged(true);
            exit();
          }}
        />
      )}
    />
  );
}
