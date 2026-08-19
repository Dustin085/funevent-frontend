import { NextResponse } from "next/server";
import { setTokenCookiesOn } from "@/lib/auth-cookie";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "@/lib/cookie-config";
import { APP_BASE_URL, GOOGLE_REDIRECT_URI } from "@/lib/google-oauth";
import { safeNextPath } from "@/lib/safe-redirect";
import type { AuthResponse } from "@/lib/api-types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * OAuth 流程的第 5～7、13 步：比對 state、把 code 轉給 Spring、設 cookie、導回去。
 *
 * ⚠️ 這裡不跟 Google 講話。兌換 code 需要 client_secret，那只在 Spring。
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  // ⚠️ 這裡刻意用 request.headers 讀 cookie，而不是 next/headers 的 cookies()：
  // 這支要在同一個回應裡「讀舊 cookie、寫新 cookie、又回傳轉址」，
  // 混用兩套 API 時寫入會不會被合併進自建的 NextResponse 是不確定的。
  // 全部走 request/response 就沒有這個問題
  const cookieHeader = request.headers.get("cookie") ?? "";
  const readCookie = (name: string) =>
    cookieHeader
      .split("; ")
      .find((entry) => entry.startsWith(`${name}=`))
      ?.slice(name.length + 1);

  // 使用者在 Google 那邊按了取消 → error=access_denied
  const oauthError = params.get("error");
  if (oauthError) {
    return failTo(
      oauthError === "access_denied" ? "oauth_cancelled" : "oauth_failed",
    );
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = readCookie(OAUTH_STATE_COOKIE);
  const codeVerifier = readCookie(OAUTH_VERIFIER_COOKIE);

  // ⚠️ state 比對是擋「登入 CSRF」的那一關：
  // 攻擊者先自己走到第 4 步拿到「他的帳號」的 code，再誘你點帶著那個 code 的連結。
  // 沒有這個比對，你的瀏覽器就會登入攻擊者的帳號，
  // 之後你在站上留下的訂單全部進他的帳戶
  if (
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState ||
    !codeVerifier
  ) {
    return failTo("oauth_state");
  }

  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        codeVerifier,
        // ⚠️ 必須和第 3 步送出的完全一致，否則 Google 回 invalid_grant。
        // 用同一個常數而不是重新組字串，就不可能不一致
        redirectUri: GOOGLE_REDIRECT_URI,
      }),
    });
  } catch {
    // Spring 沒開、網路不通 —— 和「登入失敗」是兩回事
    return failTo("server_unreachable");
  }

  if (!springResponse.ok) {
    // 409 = email 已註冊但未經 Google 驗證，不能自動綁定
    // 401 = 憑證無效／502 = Google 那邊出問題
    return failTo(
      springResponse.status === 409 ? "oauth_link_conflict" : "oauth_failed",
    );
  }

  const auth: AuthResponse = await springResponse.json();
  const next = safeNextPath(readCookie(OAUTH_NEXT_COOKIE));

  const response = NextResponse.redirect(new URL(next, APP_BASE_URL));
  setTokenCookiesOn(response, auth.accessToken, auth.refreshToken);
  clearFlowCookies(response);
  return response;
}

/** 失敗一律導回登入頁，順便把流程 cookie 清掉，不要留著下次干擾 */
function failTo(reason: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${reason}`, APP_BASE_URL),
  );
  clearFlowCookies(response);
  return response;
}

function clearFlowCookies(response: NextResponse) {
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
}
