import { z } from "zod";

/**
 * ⚠️ 這份 schema 是後端 CreateEventRequest 的 Bean Validation 的「第二份」。
 * Java 的驗證沒辦法共享給 TypeScript，所以規則活在三個地方：
 *   1. 這裡（zod）
 *   2. CreateEventRequest（@NotBlank / @NotNull）
 *   3. 資料庫（NOT NULL）
 * 這個重複是刻意接受的 —— 消除它要從 Spring 產 OpenAPI 再產 TS 型別，
 * 成本遠高於收益。改後端驗證規則時記得回來改這裡。
 */
export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "請填寫活動名稱").max(255, "活動名稱過長"),
    description: z.string().trim().min(1, "請填寫活動介紹"),
    startAt: z.string().min(1, "請選擇開始時間"),
    endAt: z.string().min(1, "請選擇結束時間"),
    // ⚠️ 不用 z.enum：選項是執行期從 API 拿的，而 schema 是靜態的。
    // 而且 <select> 只提供合法值 —— 亂填代表有人繞過了介面，
    // 那本來就該由後端擋，前端多驗一層不增加任何安全性
    category: z.string().min(1, "請選擇分類"),
    city: z.string().min(1, "請選擇縣市"),
    district: z.string().trim().max(50).optional(),
    locationName: z.string().trim().max(255).optional(),
    address: z.string().trim().max(255).optional(),
  })
  // ⚠️ 跨欄位驗證要用 refine，而且 path 要指到「使用者該去改的那一格」——
  // 指到 startAt 的話，使用者會盯著開始時間找不到問題。
  // 直接比字串是安全的：datetime-local 的格式（YYYY-MM-DDTHH:mm）字典序等於時間序
  .refine((data) => data.endAt > data.startAt, {
    message: "結束時間必須晚於開始時間",
    path: ["endAt"],
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

/**
 * datetime-local 的值（"2026-03-15T14:00"）當作台北時間，轉成 UTC 的 ISO 字串。
 *
 * ⚠️ 不能用 new Date(value).toISOString() —— 那會用「瀏覽器的時區」解讀，
 * 但顯示端（formatEventDateTime）強制用 Asia/Taipei。主辦者在 UTC 的機器上
 * 輸入 14:00，存成 14:00Z，畫面上會顯示成 22:00 —— 使用者眼中就是時間被改掉了。
 *
 * ⭐ 這裡能寫死 +08:00，是因為台灣自 1980 年起沒有日光節約時間、固定 UTC+8。
 * 換成有 DST 的國家（例如美國）就必須用時區函式庫，不能這樣硬幹。
 */
export function taipeiLocalToInstant(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}

/**
 * 反向：UTC 的 ISO 字串轉成 datetime-local 能吃的台北時間字串。
 * 編輯活動時要用它填預設值。
 */
export function instantToTaipeiLocal(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  // toISOString 給的是 UTC，但我們已經先加了 8 小時，所以切出來的就是台北時間
  return shifted.toISOString().slice(0, 16);
}
