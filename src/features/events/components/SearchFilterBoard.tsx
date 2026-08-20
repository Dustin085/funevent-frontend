import Link from "next/link";
import type { CategoryResponse, CityResponse } from "@/lib/api-types";

/**
 * 從舊專案的 SearchFilterBoard 移植。
 *
 * 舊版是多選 checkbox；分類這裡改成單選連結 —— 後端的 ?category= 只收一個值。
 * 要支援多選得先讓後端收陣列參數。
 *
 * ⚠️ 三種篩選要互相帶著走：點分類時要保留關鍵字與地區、
 * 選地區時要保留關鍵字與分類。少帶一個，使用者的篩選就會莫名消失。
 */
export function SearchFilterBoard({
  categories,
  cities,
  activeCategory,
  activeCity,
  keyword,
}: {
  categories: CategoryResponse[];
  cities: CityResponse[];
  activeCategory: string | null;
  activeCity: string | null;
  keyword: string;
}) {
  const categoryHref = (code: string | null) => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (code) params.set("category", code);
    if (activeCity) params.set("city", activeCity);
    const query = params.toString();
    return query ? `/search?${query}` : "/search";
  };

  return (
    <aside className="flex w-full flex-col gap-[18px] rounded-[10px] bg-white px-[18px] pt-5 pb-[18px] funevent-shadow lg:w-[304px] lg:shrink-0">
      <h2 className="text-[20px] font-medium text-ink-soft">活動分類</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-y-3">
        <li>
          <FilterLink href={categoryHref(null)} active={activeCategory === null}>
            全部
          </FilterLink>
        </li>
        {categories.map((category) => (
          <li key={category.code}>
            <FilterLink
              href={categoryHref(category.code)}
              active={category.code === activeCategory}
            >
              {category.name}
            </FilterLink>
          </li>
        ))}
      </ul>

      <div className="h-px w-full bg-[#d9d9d9]" />

      {/* ⚠️ 22 個縣市排成連結會是一整面牆，改用下拉。
          一樣是原生 GET 表單，不需要 JavaScript；
          q 與 category 用 hidden 欄位帶著走，否則選地區會把它們清掉 */}
      <form action="/search" className="flex flex-col gap-3">
        {keyword && <input type="hidden" name="q" value={keyword} />}
        {activeCategory && (
          <input type="hidden" name="category" value={activeCategory} />
        )}
        <label
          htmlFor="city-filter"
          className="text-[20px] font-medium text-ink-soft"
        >
          活動地區
        </label>
        <select
          id="city-filter"
          name="city"
          defaultValue={activeCity ?? ""}
          className="h-[42px] rounded-[10px] border border-[#d9d9d9] px-3 text-[16px] text-ink-soft"
        >
          <option value="">不限地區</option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-[38px] rounded-[10px] bg-brand-teal text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover"
        >
          套用
        </button>
      </form>
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
