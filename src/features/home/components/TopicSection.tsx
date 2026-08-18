import Image from "next/image";
import Link from "next/link";
import { SectionTitle } from "@/components/SectionTitle";

/**
 * ⚠️ 這整個區塊目前是視覺佔位。
 *
 * 主題名稱與圖片沿用舊專案的 eventTopicCardInfo.json，但後端沒有「主題」的概念。
 * 之後會接標籤系統（events 多對多 tags），那時：
 *   - 名稱改成從 API 拿
 *   - 連結變成真的能篩選的 /search?tag=xxx
 *
 * 現在 ?tag= 這個參數前後端都會忽略，所以八張卡片點下去都是「全部活動」——
 * 網址形狀先對齊，之後接上就不用改連結。
 */
const PLACEHOLDER_TOPICS = [
  { title: "健康運動", image: "/images/topics/01.jpg" },
  { title: "特色音樂", image: "/images/topics/02.jpg" },
  { title: "親子同樂", image: "/images/topics/03.jpg" },
  { title: "藝術彩繪", image: "/images/topics/04.jpg" },
  { title: "團康遊戲", image: "/images/topics/05.jpg" },
  { title: "游泳戲水", image: "/images/topics/06.jpg" },
  { title: "益智動腦", image: "/images/topics/07.jpg" },
  { title: "冒險探索", image: "/images/topics/08.jpg" },
];

export function TopicSection() {
  return (
    <section className="flex flex-col gap-[25px]">
      <SectionTitle title="特色主題" />

      {/* gap-y 要留得比一般大：標題膠囊會掛在卡片外面，
          間距不夠會壓到下一排 */}
      <ul className="grid grid-cols-1 justify-items-center gap-x-[23px] gap-y-[50px] sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_TOPICS.map((topic) => (
          <li key={topic.title} className="w-full max-w-[290px]">
            <TopicCard title={topic.title} image={topic.image} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopicCard({ title, image }: { title: string; image: string }) {
  return (
    <Link
      href={`/search?tag=${encodeURIComponent(title)}`}
      // hover 時放大並抬起，z-10 讓它蓋過相鄰卡片而不是被切掉
      className="group relative block aspect-[29/20] w-full rounded-[20px] shadow-[1px_1px_10px_0_rgba(0,0,0,0.3)] transition-transform duration-[350ms] hover:z-10 hover:-translate-y-[5%] hover:scale-105"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="290px"
        // rounded 要同時掛在容器和圖片上：圖片是 absolute，不會自動被容器的圓角裁到。
        // 這裡不能用 overflow-hidden —— 那會把掛在外面的膠囊一起裁掉
        className="rounded-[20px] object-cover"
      />

      {/* 膠囊掛在卡片右下角外側 —— 舊版是 bottom:-20px / right:-23px。
          手機上改成收進卡片內，否則會頂出水平捲軸 */}
      <span className="absolute right-3 bottom-3 rounded-[62px] border-4 border-white bg-brand-teal px-6 text-[18px] leading-[44px] font-medium whitespace-nowrap text-white shadow-[0_0_10px_0_rgba(0,0,0,0.3)] transition-colors duration-[350ms] group-hover:bg-brand-teal-hover sm:-right-[23px] sm:-bottom-5 sm:border-[5px] sm:px-[30px] sm:text-[24px] sm:leading-[58px]">
        {title}
      </span>
    </Link>
  );
}
