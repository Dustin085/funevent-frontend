import Image from "next/image";
import { formatEventDateTime } from "@/lib/format-date";
import type { CommentResponse } from "@/lib/api-types";
import { CommentText } from "./CommentText";
import { CommentForm } from "./CommentForm";
import { Stars } from "./Stars";
import Link from "next/link";

/**
 * 評論表單要顯示什麼。
 *
 * ⭐ 除了「有沒有登入」是前端自己知道的，其餘三種狀態全部來自後端的
 * GET .../comments/eligibility —— 前端**不複製**資格規則，而是去問。
 * 自己算的話，那些規則就會有第二份、而且遲早跟後端走鐘。
 */
export type CommentFormState =
  | "form"
  | "not-started"
  | "not-attended"
  | "login-required"
  | "already-commented";

/**
 * 活動評論區。
 *
 * ⚠️ 還沒做的：評論圖片（要先有物件儲存）、排序端點、分頁。
 * 停用的控制項刻意保持 disabled —— 能點但什麼都不會發生，比停用更糟。
 */
export function EventComments({
  eventId,
  average,
  count,
  comments,
  formState,
  loginHref,
}: {
  eventId: number;
  /** ⚠️ null 代表「還沒有人評價」，不是 0 分 */
  average: number | null;
  count: number;
  comments: CommentResponse[];
  formState: CommentFormState;
  loginHref: string;
}) {
  const hasComments = count > 0 && average !== null;

  return (
    <div className="flex flex-col gap-[18px]">
      {/* ⚠️ 沒有評論時只跳過「摘要與列表」，不能提早 return ——
          那樣零評論的活動就永遠看不到表單，沒有人能寫第一則 */}
      {hasComments ? (
        <ExistingComments average={average} count={count} comments={comments} />
      ) : (
        <p className="py-8 text-center text-ink-muted">
          還沒有人評價這個活動。
        </p>
      )}

      <CommentFormArea
        eventId={eventId}
        formState={formState}
        loginHref={loginHref}
      />
    </div>
  );
}

/**
 * 依狀態顯示表單或說明。
 *
 * ⚠️ 這些訊息是**顯示後端給的答案**，不是前端自己判斷出來的 ——
 * 除了「請先登入」（那是前端本來就知道的），其餘都來自 eligibility 端點。
 */
function CommentFormArea({
  eventId,
  formState,
  loginHref,
}: {
  eventId: number;
  formState: CommentFormState;
  loginHref: string;
}) {
  if (formState === "not-started") {
    return (
      <p className="rounded-[10px] bg-[#f7f9f9] p-5 text-center text-ink-muted">
        活動開始後，參加過的人可以在這裡留下評論。
      </p>
    );
  }
  if (formState === "login-required") {
    return (
      <p className="rounded-[10px] bg-[#f7f9f9] p-5 text-center text-ink-muted">
        <Link
          href={loginHref}
          className="text-brand-teal transition-colors duration-[350ms] hover:underline"
        >
          登入
        </Link>
        後，參加過這場活動的人可以留下評論。
      </p>
    );
  }
  if (formState === "already-commented") {
    return (
      <p className="rounded-[10px] bg-[#f7f9f9] p-5 text-center text-ink-muted">
        你已經評論過這個活動了，感謝你的分享！
      </p>
    );
  }
  if (formState === "not-attended") {
    return (
      <p className="rounded-[10px] bg-[#f7f9f9] p-5 text-center text-ink-muted">
        只有購票並完成付款的參加者可以留下評論。
      </p>
    );
  }
  return <CommentForm eventId={eventId} />;
}

/** 評分摘要 + 評論列表。只在真的有評論時渲染 */
function ExistingComments({
  average,
  count,
  comments,
}: {
  average: number;
  count: number;
  comments: CommentResponse[];
}) {
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

