import Image from "next/image";

/**
 * 五顆星，依分數四捨五入到整顆（舊專案沒有半顆星的圖）。
 *
 * ⚠️ 從 EventComments 抽出來的：會員中心的「我的評論」也要用。
 * 複製一份的話，兩邊的星星遲早會長得不一樣。
 *
 * role="img" + aria-label：只有圖示沒有數字時，
 * 螢幕閱讀器要能讀到分數，不能只靠視覺。
 */
export function Stars({
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
