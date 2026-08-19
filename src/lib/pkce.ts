/**
 * PKCE 與 state 用的隨機值。
 *
 * 用 Web Crypto 而不是 Node 的 crypto 模組 —— Route Handler 預設跑在 Node，
 * 但這樣寫在 Edge Runtime 也能動，之後要搬不用改。
 */

/** base64url：base64 換掉三個字元。RFC 4648 §5，PKCE 規範指定的編碼 */
function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * 32 個隨機位元組 → 43 個字元的 base64url。
 * PKCE 規範要求 code_verifier 是 43～128 字元，43 是下限剛好。
 */
export function randomUrlSafeString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * code_challenge = BASE64URL(SHA256(code_verifier))
 *
 * ⚠️ 送出去的是這個雜湊，原文只留在自己的 httpOnly cookie 裡。
 * 雜湊是單向的，所以就算整個授權請求連同 code 都被攔截，
 * 攻擊者也推不回 verifier，換不到 token。
 */
export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return base64UrlEncode(new Uint8Array(digest));
}
