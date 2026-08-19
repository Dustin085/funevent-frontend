/**
 * Google 登入流程的共用常數。
 *
 * ⚠️ 抽出來的關鍵理由是 GOOGLE_REDIRECT_URI：
 * 它在「第 3 步送給 Google」和「第 7 步轉給 Spring 兌換」時必須是完全相同的字串，
 * 分別寫兩次的話，哪天改了 path 只改一邊 —— Google 會回 invalid_grant，
 * 而錯誤訊息完全不會提到是哪裡不一致。
 */
export const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

/** ⚠️ 這個字串要和 Google Console「已授權的重新導向 URI」一字不差（含結尾有沒有斜線） */
export const GOOGLE_REDIRECT_URI = `${APP_BASE_URL}/api/auth/oauth/google/callback`;

export const GOOGLE_AUTHORIZE_URI = "https://accounts.google.com/o/oauth2/v2/auth";
