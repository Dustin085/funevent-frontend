import type { CategoryResponse, CityResponse } from "@/lib/api-types";

/**
 * 從舊專案的 SearchFilterBoard 移植 —— 和舊版一樣是多選 checkbox。
 *
 * ⭐ 整塊是一個原生的 GET 表單，勾選後按「套用」送出，不需要 JavaScript。
 * 瀏覽器會把同名的 checkbox 變成重複的參數（?category=A&category=B），
 * Spring 那邊直接綁成 List。
 *
 * ⚠️ 分類與地區必須在**同一個** form 裡共用一個送出鈕。
 * 拆成兩個表單的話，套用地區時分類的勾選會整個消失 ——
 * GET 表單只會送出「自己表單裡」的欄位。
 */
export function SearchFilterBoard({
  categories,
  cities,
  activeCategories,
  activeCities,
  keyword,
}: {
  categories: CategoryResponse[];
  cities: CityResponse[];
  activeCategories: string[];
  activeCities: string[];
  keyword: string;
}) {
  return (
    <aside className="w-full lg:w-[304px] lg:shrink-0">
      <form
        action="/search"
        className="flex flex-col gap-[18px] rounded-[10px] bg-white px-[18px] pt-5 pb-[18px] funevent-shadow"
      >
        {/* 關鍵字不在這個表單的可見欄位裡，要用 hidden 帶著走 */}
        {keyword && <input type="hidden" name="q" value={keyword} />}

        <fieldset>
          <legend className="text-[20px] font-medium text-ink-soft mb-3">
            活動分類
          </legend>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-y-2">
            {categories.map((category) => (
              <li key={category.code}>
                <FilterCheckbox
                  name="category"
                  value={category.code}
                  label={category.name}
                  defaultChecked={activeCategories.includes(category.code)}
                />
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="h-px w-full bg-[#d9d9d9]" />

        <fieldset>
          <legend className="text-[20px] font-medium text-ink-soft mb-3">
            活動地區
          </legend>
          {/* ⚠️ 22 個縣市會很長，限制高度讓它自己捲，不要把整個側欄撐爛 */}
          <ul className="flex max-h-[240px] flex-wrap gap-x-4 gap-y-2 overflow-y-auto lg:flex-col lg:gap-y-2">
            {cities.map((city) => (
              <li key={city.code}>
                <FilterCheckbox
                  name="city"
                  value={city.code}
                  label={city.name}
                  defaultChecked={activeCities.includes(city.code)}
                />
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="flex gap-2">
          <button
            type="submit"
            className="h-[38px] flex-1 rounded-[10px] bg-brand-teal text-[16px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover"
          >
            套用篩選
          </button>
          {/* 清除是一個普通連結，不是 reset ——
              reset 只會把勾選還原成畫面載入時的狀態，不會真的重新查詢 */}
          <a
            href={keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search"}
            className="flex h-[38px] items-center rounded-[10px] border border-[#d9d9d9] px-4 text-[16px] text-ink-muted transition-colors duration-[350ms] hover:text-ink-soft"
          >
            清除
          </a>
        </div>
      </form>
    </aside>
  );
}

function FilterCheckbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[16px] text-ink-soft transition-colors duration-[350ms] hover:text-brand">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 accent-brand"
      />
      {label}
    </label>
  );
}
