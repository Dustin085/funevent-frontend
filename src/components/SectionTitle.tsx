import Image from "next/image";

/** 從舊專案的 .funevent-main-title 移植：左邊色塊、右邊向外延伸的虛線 */
export function SectionTitle({ title }: { title: string }) {
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
      {/* 虛線在手機上藏起來 —— 寬度不夠時它只會擠壓標題文字 */}
      <span
        className="ml-[15px] hidden h-[26px] flex-1 bg-[url('/images/funevent-main-title-dotted-line.svg')] bg-center bg-repeat-x sm:block"
        aria-hidden
      />
    </h2>
  );
}
