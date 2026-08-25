import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SectionTitle } from "@/components/SectionTitle";
import { PasswordForm } from "@/features/account/components/PasswordForm";
import { ProfileForm } from "@/features/account/components/ProfileForm";
import { getCurrentUser } from "@/lib/get-current-user";

// robots noindex：要登入才有內容，爬蟲只會拿到空殼
export const metadata: Metadata = {
  title: "會員中心",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/account")}`);

  return (
    // ⚠️ 版面寬度與外距交給 (member)/layout.tsx —— 這裡只負責內容，
    // 各頁自己再包一層 mx-auto max-w 會跟側邊欄的版面打架
    <main className="flex flex-col gap-6">
      <SectionTitle title="帳號管理" />

      <Section title="基本資料">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[15px] font-medium text-ink-soft">電子信箱</p>
          {/* ⚠️ 唯讀：換信箱必須先驗證新信箱（寄確認信），
              否則等於讓人把帳號改成別人的信箱。那是另一套流程，還沒做 */}
          <p className="text-ink-muted">{user.email}</p>
        </div>
        <ProfileForm defaultName={user.name} />
      </Section>

      <Section title="密碼">
        {user.hasPassword ? (
          <PasswordForm />
        ) : (
          /* ⚠️ 第三方登入建立的帳號沒有密碼，「修改」不成立。
             「為第三方帳號設定密碼」是另一支端點，還沒做 */
          <p className="text-ink-muted">
            這個帳號是使用 Google 登入建立的，沒有密碼可以修改。
          </p>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] bg-white p-6 funevent-shadow sm:p-8">
      <h2 className="mb-5 text-[20px] font-medium text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}

