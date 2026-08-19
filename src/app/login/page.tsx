import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/get-current-user";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * OAuth 流程失敗時 callback 會導回這裡並帶 ?error=<code>。
 * 這些 code 由 app/api/auth/oauth/google/callback/route.ts 產生。
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "已取消 Google 登入。",
  oauth_state: "登入流程已逾時或無效，請重新登入。",
  oauth_link_conflict:
    "這個 email 已經註冊過了。請先用密碼登入，之後再綁定 Google 帳號。",
  oauth_failed: "Google 登入失敗，請稍後再試。",
  server_unreachable: "無法連線到伺服器，請稍後再試。",
  oauth_config: "第三方登入尚未設定完成，請聯絡管理員。",
};

/**
 * ⚠️ 一定要查表，不能把 error 參數的值直接印在畫面上。
 * 那個值完全來自網址列 —— 直接渲染等於讓任何人做出一個連結，
 * 在「你的網域、你的登入頁」上顯示他想要的文字（例如「請改到 xxx 登入」）。
 * 認不得的 code 就給一句通用的。
 */
function resolveOAuthErrorMessage(
  error: string | string[] | undefined,
): string | null {
  const code = Array.isArray(error) ? error[0] : error;
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? "登入失敗，請稍後再試。";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  // 使用者可控的參數，一律先收斂成站內路徑
  const nextPath = safeNextPath(next);
  const oauthErrorMessage = resolveOAuthErrorMessage(error);

  // 已登入就不該再看到登入頁 —— 直接送到他原本想去的地方
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold text-foreground">登入</h2>

        {/* role="alert" 讓螢幕閱讀器在頁面載入時就唸出來 ——
            這段是「上一次操作失敗了」的結果，不是靜態說明 */}
        {oauthErrorMessage && (
          <p
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {oauthErrorMessage}
          </p>
        )}

        <LoginForm next={nextPath} />

        {/* 分隔線。aria-hidden：「或」只是視覺分隔，唸出來沒有意義 */}
        <div className="my-5 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-gray-300" />
          <span className="text-sm text-gray-500">或</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>

        {/* next 一路帶下去：Google 登入完要回到他原本想去的頁面 */}
        <GoogleLoginButton next={nextPath} />

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
