import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getCurrentUser } from "@/lib/get-current-user";
import { safeNextPath } from "@/lib/safe-redirect";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";

export const metadata: Metadata = { title: "註冊" };

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  // 已登入就不該再看到註冊頁
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">註冊</h2>
        <RegisterForm next={nextPath} />
        {/* 分隔線。aria-hidden：「或」只是視覺分隔，唸出來沒有意義 */}
        <div className="my-5 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-gray-300" />
          <span className="text-sm text-gray-500">或</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>

        {/* next 一路帶下去：Google 登入完要回到他原本想去的頁面 */}
        <GoogleLoginButton next={nextPath} />
        <p className="mt-4 text-sm text-foreground">
          已經有帳號了？{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="text-brand-teal hover:underline"
          >
            前往登入
          </Link>
        </p>
      </div>
    </main>
  );
}
