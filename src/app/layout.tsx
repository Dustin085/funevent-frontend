import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_TC } from "next/font/google";
import { Topbar } from "@/components/Topbar";
import { getCurrentUser } from "@/lib/get-current-user";
import "./globals.css";

/**
 * 舊專案用的就是 Noto Sans TC。中文在 Geist / Arial 下會 fallback 到系統字型，
 * 那是跟舊視覺差距最明顯的地方之一。
 *
 * 沒有指定 subsets: ["chinese-traditional"] —— 那個子集非常大，
 * 交給 next/font 依實際用到的字元切分即可。
 */
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "活動趣 FunEvent",
  description: "找活動、辦活動，都在活動趣",
};

// Server Component 可以是 async —— 直接在元件裡 await 資料，
// 不需要 useEffect 或 getServerSideProps
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 讀 httpOnly cookie → 打 Spring /api/users/me
  // 這在 server 執行，瀏覽器看不到 token
  const user = await getCurrentUser();

  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* font-sans 在 globals.css 的 @theme inline 裡指向 --font-noto-sans-tc */}
      <body className="flex min-h-full flex-col font-sans">
        {/* 登入狀態當作 props 傳給 client component，
            Topbar 自己不抓資料也不存資料 */}
        <Topbar user={user} />
        {children}
      </body>
    </html>
  );
}
