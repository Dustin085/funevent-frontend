import { NextResponse } from "next/server";
import {
  COOKIE_OPTIONS,
  OAUTH_FLOW_MAX_AGE_SECONDS,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "@/lib/cookie-config";
import {
  APP_BASE_URL,
  GOOGLE_AUTHORIZE_URI,
  GOOGLE_REDIRECT_URI,
} from "@/lib/google-oauth";
import { randomUrlSafeString, sha256Base64Url } from "@/lib/pkce";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * OAuth 流程的第 1～3 步：產生 state 與 PKCE，把使用者送去 Google。
 *
 * 這是一個 GET —— 登入按鈕是普通的 <a>，不需要 JavaScript。
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // 設定漏了就明確失敗，不要送一個缺參數的網址給 Google，
    // 讓它回一個看不懂的錯誤畫面
    console.error("缺少環境變數 GOOGLE_CLIENT_ID");
    return NextResponse.redirect(
      new URL("/login?error=oauth_config", APP_BASE_URL),
    );
  }

  const next = safeNextPath(
    new URL(request.url).searchParams.get("next") ?? undefined,
  );

  const state = randomUrlSafeString();
  const codeVerifier = randomUrlSafeString();
  const codeChallenge = await sha256Base64Url(codeVerifier);

  const authorizeUrl = new URL(GOOGLE_AUTHORIZE_URI);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  // ⚠️ openid 一定要有，否則 Google 不會回 id_token（只會給 access_token），
  // 而我們要的正是 id_token
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  // 讓使用者選要用哪個 Google 帳號，而不是默默用上次那個
  authorizeUrl.searchParams.set("prompt", "select_account");
  // 沒有設 access_type=offline —— 那是要拿 Google 的 refresh token 才需要的。
  // 我們只是要確認身分，拿完 id_token 就不再跟 Google 打交道

  const response = NextResponse.redirect(authorizeUrl);
  const flowCookie = { ...COOKIE_OPTIONS, maxAge: OAUTH_FLOW_MAX_AGE_SECONDS };
  // ⚠️ verifier 只寫進 httpOnly cookie，絕不放進送給 Google 的網址 ——
  // 網址裡放的是它的 SHA-256 雜湊（code_challenge）
  response.cookies.set(OAUTH_STATE_COOKIE, state, flowCookie);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, flowCookie);
  response.cookies.set(OAUTH_NEXT_COOKIE, next, flowCookie);
  return response;
}
