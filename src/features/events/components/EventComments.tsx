import Image from "next/image";
import { formatEventDateTime } from "@/lib/format-date";
import type { CommentResponse } from "@/lib/api-types";
import { CommentText } from "./CommentText";

/**
 * 活動評論區。
 *
 * ⚠️ 還沒做的：評論圖片（要先有物件儲存）、排序端點、分頁、
 * 以及「寫評論」的表單。停用的控制項刻意保持 disabled ——
 * 能點但什麼都不會發生，比停用更糟。
 */
export function EventComments({
  average,
  count,
  comments,
}: {
  /** ⚠️ null 代表「還沒有人評價」，不是 0 分 */
  average: number | null;
  count: number;
  comments: CommentResponse[];
}) {
  // 還沒有人評價時，整個評分區塊沒有東西可顯示 —— 顯示 0.0 是憑空給差評
  if (count === 0 || average === null) {
    return (
      <p className="py-10 text-center text-ink-muted">
        還沒有人評價這個活動。參加過的人可以在活動開始後留下評論。
      </p>
    );
  }

  // 後端回的是原始平均（例如 4.333…），顯示到小數第一位
  const score = Number(average.toFixed(1));

  return (
    <div className="flex flex-col gap-[18px]">
      {/* 總評分。舊版 .rating-box：flex-wrap + justify-evenly + align-end */}
      <div className="flex flex-wrap items-end justify-evenly gap-4">
        <div className="flex items-end leading-none">
          <p className="text-[60px] font-semibold text-brand">{score}</p>
          <p className="text-[36px] font-semibold text-ink-muted">/5</p>
        </div>

        <Stars score={score} size={48} gap={13} />

        <p className="text-[16px] font-medium whitespace-nowrap text-[#a8a8a8]">
          共 {count} 人評價
        </p>
      </div>

      {/* 分隔線。舊版的 .split-line-row */}
      <div className="h-px w-full bg-[#d9d9d9]" />

      {/* ⚠️ 後端沒有排序端點。做成 disabled 而不是「能選但沒反應」——
          後者會讓人以為壞掉。appearance-none + 自製箭頭是舊版的做法 */}
      <select
        disabled
        aria-label="評論排序（尚未開放）"
        className="self-end appearance-none bg-[url('/images/arrow-down-gray.svg')] bg-[length:16px_16px] bg-right bg-no-repeat pr-[26px] text-[20px] font-medium text-ink-title disabled:opacity-60"
      >
        <option>從新到舊</option>
        <option>最熱門</option>
      </select>

      <ul className="flex flex-col gap-[35px]">
        {comments.map((comment) => (
          <li key={comment.id} className="flex items-start gap-4 sm:gap-[30px]">
            {/* ⚠️ User 沒有頭像欄位，一律用預設圖示。
                之後做頭像上傳時這裡換成 comment.avatarUrl ?? 預設 */}
            <Image
              src="/images/login-icon.svg"
              alt=""
              width={86}
              height={86}
              aria-hidden
              className="h-14 w-14 shrink-0 rounded-full bg-brand-teal object-cover p-3 sm:h-[86px] sm:w-[86px]"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex items-end gap-[14px]">
                <p className="text-[20px] font-medium text-ink">
                  {comment.userName}
                </p>
                <p className="text-[14px] text-ink-muted">
                  {formatEventDateTime(comment.createdAt)}
                </p>
              </div>

              <Stars score={comment.rating} size={24} gap={6} />

              {/* 內容可為 null —— 只給星等不寫字是合理的評價方式 */}
              {comment.content && <CommentText text={comment.content} />}
            </div>
          </li>
        ))}
      </ul>

      {/* ⚠️ 沒有分頁端點，先停用 */}
      <button
        type="button"
        disabled
        className="w-[70%] self-center rounded-[10px] bg-brand-amber px-[19px] py-[6px] text-[16px] whitespace-nowrap text-white disabled:opacity-60"
      >
        觀看更多評論
      </button>
    </div>
  );
}

/**
 * 五顆星，依分數四捨五入到整顆（舊專案沒有半顆星的圖）。
 *
 * role="img" + aria-label：只有圖示沒有數字時，
 * 螢幕閱讀器要能讀到分數，不能只靠視覺。
 */
function Stars({
  score,
  size,
  gap,
}: {
  score: number;
  size: number;
  gap: number;
}) {
  const filled = Math.round(score);
  return (
    <div
      role="img"
      aria-label={`${score} 分，滿分 5 分`}
      className="flex"
      style={{ columnGap: gap }}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Image
          key={index}
          src={
            index < filled
              ? "/images/rating-icon--filled.svg"
              : "/images/rating-icon.svg"
          }
          alt=""
          width={size}
          height={size}
          aria-hidden
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
