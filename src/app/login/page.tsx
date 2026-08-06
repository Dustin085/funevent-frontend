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
        <h2 className="mb-6 text-2xl font-bold text-ink">登入</h2>
        <LoginForm />
      </div>
    </main>
  );
}
