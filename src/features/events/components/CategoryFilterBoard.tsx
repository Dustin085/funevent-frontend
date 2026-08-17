import Link from "next/link";
import type { CategoryResponse } from "@/lib/api-types";

/**
 * 從舊專案的 SearchFilterBoard 移植。
 *
 * 舊版是多選 checkbox；這裡改成單選連結 —— 後端的 ?category= 只收一個值。
 * 要支援多選得先讓後端收陣列參數。
 *
 * 地區與價格篩選需要後端支援 ?city= 與價格區間，先不放不能用的 UI。
 */
export function CategoryFilterBoard({
  categories,
  activeCode,
}: {
  categories: CategoryResponse[];
  activeCode: string | null;
}) {
  return (
    <aside className="flex w-full flex-col gap-[18px] rounded-[10px] bg-white px-[18px] pt-5 pb-[10px] funevent-shadow lg:w-[304px] lg:shrink-0">
      <h2 className="text-[20px] font-medium text-ink-soft">活動分類</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-y-3">
        <li>
          <FilterLink href="/search" active={activeCode === null}>
            全部
          </FilterLink>
        </li>
        {categories.map((category) => (
          <li key={category.code}>
            <FilterLink
              href={`/search?category=${category.code}`}
              active={category.code === activeCode}
            >
              {category.name}
            </FilterLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-[16px] transition-colors duration-[350ms] hover:text-brand ${
        active ? "font-bold text-brand" : "text-ink-soft"
      }`}
    >
      {children}
    </Link>
  );
}
