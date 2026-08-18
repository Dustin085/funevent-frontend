import Image from "next/image";
import { CommentText } from "./CommentText";

/**
 * ⚠️ 整區都是假資料。評論系統要能上線需要：
 * comments 表、「訂單完成才能評」的規則、avg + count 聚合（別做成 1+N）、
 * 一張訂單只能評一次的唯一約束、以及評論圖片的上傳與儲存。
 *
 * 排序下拉與「觀看更多評論」也都還沒有對應的端點，故意做成停用狀態 ——
 * 能點但什麼都不會發生，比停用更糟。
 */
const PLACEHOLDER_COMMENTS = [
  {
    name: "Lily Thompson",
    avatarUrl: "/images/comments/avatar-1.png",
    date: "2024.04.16",
    score: 5,
    text: "講師是我高中時期最愛樂團的吉他手，不來實在說不過去了呀！我選擇的方案是親子一同彈，在彈唱的過程中，我和孩子互相分享了自己喜歡的音樂，謝謝蘭響為我創造了獨一無二的親子回憶。整堂課節奏抓得很好，從調音到第一次完整彈完一首歌，兩個小時就過去了。",
    pictureUrl: "/images/comments/pic-1.png",
    morePictures: 2,
  },
  {
    name: "Ethan Parker",
    avatarUrl: "/images/comments/avatar-2.png",
    date: "2024.01.10",
    score: 4,
    text: "參加這次的吉他課程真是太棒了！從一開始連基本的和弦都彈不出來，到現在能彈奏一些簡單的曲子，這段學習過程真的很有趣。老師非常耐心，一步步地教我如何正確按弦、彈奏，讓我逐漸克服了最初的困難。唯一小可惜是時間有點趕。",
    pictureUrl: "/images/comments/pic-2.png",
    morePictures: 2,
  },
  {
    // 沒有附圖的評論 —— 版面必須撐得住這種情況
    name: "林同學",
    avatarUrl: null,
    date: "2023.11.02",
    score: 4,
    text: "內容紮實，場地乾淨，器材也維護得很好。",
    pictureUrl: null,
    morePictures: 0,
  },
];

export function EventComments({
  rating,
}: {
  rating: { score: number; count: number };
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      {/* 總評分。舊版 .rating-box：flex-wrap + justify-evenly + align-end */}
      <div className="flex flex-wrap items-end justify-evenly gap-4">
        <div className="flex items-end leading-none">
          <p className="text-[60px] font-semibold text-brand">{rating.score}</p>
          <p className="text-[36px] font-semibold text-ink-muted">/5</p>
        </div>

        <Stars score={rating.score} size={48} gap={13} />

        <p className="text-[16px] font-medium whitespace-nowrap text-[#a8a8a8]">
          共 {rating.count} 人評價
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
        {PLACEHOLDER_COMMENTS.map((comment) => (
          <li
            key={comment.name}
            className="flex items-start gap-4 sm:gap-[30px]"
          >
            {/* 沒有頭像時退回預設圖示，版面不會因此塌掉 */}
            <Image
              src={comment.avatarUrl ?? "/images/login-icon.svg"}
              alt=""
              width={86}
              height={86}
              aria-hidden
              className={`h-14 w-14 shrink-0 rounded-full object-cover sm:h-[86px] sm:w-[86px] ${
                comment.avatarUrl ? "" : "bg-brand-teal p-3"
              }`}
            />

            {/* 手機上附圖排到文字下方；sm 以上才回到右側並靠下對齊
                （舊版 align-self: flex-end） */}
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:gap-[22px]">
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex items-end gap-[14px]">
                  <p className="text-[20px] font-medium text-ink">
                    {comment.name}
                  </p>
                  <p className="text-[14px] text-ink-muted">{comment.date}</p>
                </div>

                <Stars score={comment.score} size={24} gap={6} />

                <CommentText text={comment.text} />
              </div>

              {comment.pictureUrl && (
                <div className="relative h-[104px] w-[149px] shrink-0">
                  <Image
                    src={comment.pictureUrl}
                    alt=""
                    fill
                    sizes="149px"
                    aria-hidden
                    className="rounded-[5px] object-cover"
                  />
                  {comment.morePictures > 0 && (
                    // ⚠️ 純裝飾：燈箱還沒做，所以不是 <button>
                    <span className="absolute right-0 bottom-0 rounded-[5px_5px_10px_5px] bg-black px-2 py-0.5 text-[14px] text-white">
                      +{comment.morePictures}
                    </span>
                  )}
                </div>
              )}
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
