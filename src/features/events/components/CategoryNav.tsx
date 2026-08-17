import Image from "next/image";
import Link from "next/link";
import type { CategoryResponse } from "@/lib/api-types";

/**
 * 從舊專案 index.html 的 #home-page-event-category 移植。
 *
 * 保留：82px 圖示、hover 時整張卡放大且圖示微傾。
 * 連結維持原設計 —— 導向搜尋頁，而不是就地篩選首頁。
 *
 * 圖示檔名由 code 推導（MUSIC_GROOVE → music-groove.svg），
 * 後端加分類時前端只要放一張同名的圖，不用改程式碼。
 */
export function CategoryNav({ categories }: { categories: CategoryResponse[] }) {
  return (
    <nav>
      <ul className="grid grid-cols-4 justify-items-center gap-y-6 md:flex md:justify-center md:gap-[33px]">
        {categories.map((category) => (
          <li key={category.code}>
            <Link
              href={`/search?category=${category.code}`}
              className="group flex flex-col items-center gap-[6.5px] transition-transform duration-[350ms] hover:-translate-y-[5%] hover:scale-105"
            >
              <Image
                src={`/images/category/${toIconName(category.code)}.svg`}
                alt=""
                width={82}
                height={82}
                aria-hidden
                className="h-[64px] w-[64px] transition-transform duration-[350ms] group-hover:translate-x-[1.5%] group-hover:-translate-y-[3.5%] group-hover:rotate-2 md:h-[82px] md:w-[82px]"
              />
              <p className="text-[16px] font-medium text-ink-brown md:text-[20px]">
                {category.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** MUSIC_GROOVE → music-groove */
function toIconName(code: string): string {
  return code.toLowerCase().replaceAll("_", "-");
}
