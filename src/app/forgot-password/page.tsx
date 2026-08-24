import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import Link from "next/link";

// robots noindex：這頁沒有值得索引的內容
export const metadata: Metadata = {
  title: "忘記密碼",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">重設密碼</h2>
        <ForgotPasswordForm />
        <p className="mt-4 text-sm text-foreground">
          <Link href="/login" className="text-brand-teal hover:underline">
            返回登入
          </Link>
        </p>
      </div>
    </main>
  );
}
