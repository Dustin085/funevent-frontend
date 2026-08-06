import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Topbar } from "@/components/Topbar";
import { getCurrentUser } from "@/lib/get-current-user";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 登入狀態當作 props 傳給 client component，
            Topbar 自己不抓資料也不存資料 */}
        <Topbar user={user} />
        {children}
      </body>
    </html>
  );
}
