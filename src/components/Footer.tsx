import Image from "next/image";
import Link from "next/link";

/**
 * 從舊專案 web/assets/js/Footer.jsx 移植。
 *
 * 保留：深灰底、上緣的橢圓弧形、白色細分隔線、大 logo、著作權置中。
 *
 * 內容改掉了：舊版有 13 個 href="#" 的死連結、APP 下載按鈕與三個社群圖示 ——
 * 那些頁面、App、社群帳號都不存在。這裡只放真的能去的地方，
 * 寧可欄目少一點，也不要放點了沒反應的連結。
 */
export function Footer() {
  return (
    <footer className="relative lg:funevent-arc-top lg:pt-[30px] flex flex-col items-center overflow-hidden bg-ink-soft px-6 lg:px-[144px]">
      {/* 弧形背景：145.8vw 寬的橢圓貼齊底部，露出來的上緣就是那道弧線。
          刻意不用負 z-index —— 它跟 footer 同色，靠 DOM 順序讓後面的內容蓋上去就好。
          需要 overflow-hidden，否則 145.8vw 會撐出水平捲軸 */}
      {/* <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-[325px] w-[145.8vw] -translate-x-1/2 bg-ink-soft [clip-path:ellipse()]"
      /> */}

      <nav className="relative w-full max-w-[1034px] pt-12">
        <ul className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          <FooterColumn title="探索">
            <FooterLink href="/">即將登場</FooterLink>
            <FooterLink href="/search">全部活動</FooterLink>
          </FooterColumn>

          {/* 分類代碼直接寫死。它們是後端的 enum，穩定且不會擅自變動；
              就算之後改名，前端的白名單過濾會讓它退回「全部活動」，不會壞掉 */}
          <FooterColumn title="熱門分類">
            <FooterLink href="/search?category=MUSIC_GROOVE">音樂律動</FooterLink>
            <FooterLink href="/search?category=ART_CULTURE">藝術人文</FooterLink>
            <FooterLink href="/search?category=CREATIVE_DIY">創意手作</FooterLink>
            <FooterLink href="/search?category=SPORT">活力運動</FooterLink>
          </FooterColumn>

          <FooterColumn title="會員">
            <FooterLink href="/orders">我的訂單</FooterLink>
            <FooterLink href="/login">註冊 / 登入</FooterLink>
          </FooterColumn>

          <FooterColumn title="關於活動趣">
            <p className="text-[14px] leading-6 text-white/80">
              以 Next.js 與 Spring Boot 打造的售票平台，
              目前為開發中的學習專案。
            </p>
          </FooterColumn>
        </ul>
      </nav>

      <div className="relative mt-[17px] mb-5 h-px w-4/5 bg-white/60" />

      <div className="relative mb-[47px] flex w-full max-w-[1034px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <Link href="/">
          <Image
            src="/images/logo-big.svg"
            alt="活動趣 FunEvent"
            width={160}
            height={44}
            className="h-auto w-[140px] sm:w-[160px]"
          />
        </Link>
        <small className="text-[14px] text-white">
          COPYRIGHT © {new Date().getFullYear()} FunEvent All rights reserved.
        </small>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <h3 className="mb-[10px] text-[18px] font-medium text-white">{title}</h3>
      <ul className="flex flex-col gap-[10px]">{children}</ul>
    </li>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[14px] text-white transition-colors duration-[350ms] hover:text-brand"
      >
        {children}
      </Link>
    </li>
  );
}