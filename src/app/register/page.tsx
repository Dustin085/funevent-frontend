import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function RegisterPage() {
  // 已登入就不該再看到註冊頁
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-ink">註冊</h2>
        <RegisterForm />
        <p className="mt-4 text-sm text-ink-soft">
          已經有帳號了？{" "}
          <Link href="/login" className="text-brand-teal hover:underline">
            前往登入
          </Link>
        </p>
      </div>
    </main>
  );
}
