import Image from "next/image";
import Link from "next/link";

/**
 * 從舊專案的 .funevent-main-title 移植：左邊色塊、右邊延伸的虛線、
 * 以及可選的「觀看更多」（舊版的 moreBtnActive）。
 */
export function SectionTitle({
  title,
  moreHref,
}: {
  title: string;
  moreHref?: string;
}) {
  return (
    <h2 className="flex items-center text-[24px] font-bold text-brand sm:text-[32px]">
      <Image
        src="/images/funevent-main-title-color-block.svg"
        alt=""
        width={39}
        height={26}
        className="mr-1 w-[28px] sm:w-[39px]"
        aria-hidden
      />
      {title}
      {/* 虛線裝飾在手機上藏起來，寬度不夠時它只會擠壓標題 */}
      <span
        className="mx-[15px] hidden h-[26px] flex-1 bg-[url('/images/funevent-main-title-dotted-line.svg')] bg-center bg-repeat-x sm:block"
        aria-hidden
      />
      {/* 舊版用 position:absolute + right:12.32% 把按鈕釘住。
          虛線已經是 flex-1，按鈕自然會被推到最右邊 ——
          不需要絕對定位，窄螢幕上也不會跟標題重疊 */}
      {moreHref && (
        <Link
          href={moreHref}
          className="ml-auto flex shrink-0 items-center gap-1 text-[16px] text-brand transition-colors duration-[350ms] hover:text-brand-hover sm:ml-0 sm:text-[20px]"
        >
          觀看更多
          <Image
            src="/images/triangle-right.svg"
            alt=""
            width={12}
            height={12}
            aria-hidden
          />
        </Link>
      )}
    </h2>
  );
}
