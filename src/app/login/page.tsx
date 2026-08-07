import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function LoginPage() {
  // 已登入就不該再看到登入頁
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">登入</h2>
        <LoginForm />
        <p className="mt-4 text-sm text-foreground">
          還沒有帳號？{" "}
          <Link href="/register" className="text-brand-teal hover:underline">
            前往註冊
          </Link>
        </p>
        <p className="mt-4 text-sm text-foreground">
          <Link
            href="/forgot-password"
            className="text-brand-teal hover:underline"
          >
            忘記密碼
          </Link>
        </p>
      </div>
    </main>
  );
}
