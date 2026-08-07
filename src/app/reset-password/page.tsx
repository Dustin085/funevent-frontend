import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">重設密碼</h2>
        {/* useSearchParams 需要 Suspense */}
        <Suspense fallback={<p className="text-foreground">載入中...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
