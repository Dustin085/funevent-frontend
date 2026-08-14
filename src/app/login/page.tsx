import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/get-current-user";
import { safeNextPath } from "@/lib/safe-redirect";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  // 使用者可控的參數，一律先收斂成站內路徑
  const nextPath = safeNextPath(next);

  // 已登入就不該再看到登入頁 —— 直接送到他原本想去的地方
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">登入</h2>
        <LoginForm next={nextPath} />
        <p className="mt-4 text-sm text-foreground">
          還沒有帳號？{" "}
          {/* 把 next 一路帶下去，註冊完回到登入頁時才不會斷掉 */}
          <Link
            href={`/register?next=${encodeURIComponent(nextPath)}`}
            className="text-brand-teal hover:underline"
          >
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
