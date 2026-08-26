/**
 * 允許外連的圖片網域，next.config.ts 的 remotePatterns 由這裡產生。
 *
 * ⚠️ 絕對不要開放任意網域：next/image 是在**伺服器端**抓圖再最佳化，
 * 開放等於讓任何人叫你的伺服器去抓任意網址（SSRF）。
 *
 * ⚠️ 之後接 R2 時，這裡換成自己的圖片網域即可 ——
 * 資料模型與表單都不用動，變的只有「網址從哪來」。
 */
export const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  // Unsplash+ 的付費圖走這個網域
  "plus.unsplash.com",
  "picsum.photos",
  "images.pexels.com",
] as const;

/**
 * 這個網址能不能交給 next/image。
 *
 * ⭐ 為什麼每個渲染點都要先問過它：next/image 對「不在 remotePatterns 裡的網域」
 * 是**拋出錯誤**，不是安靜地顯示失敗 —— 一張壞圖會讓整個頁面崩潰。
 * 圖片網址是主辦者手動貼進來的，打錯一個字（image.unsplash.com 少一個 s）
 * 就足以讓首頁掛掉，所以資料庫來的網址一律不能直接相信。
 *
 * ⚠️ 相對路徑一律放行 —— seeder 塞的 /images/events/x.jpg 是自家的靜態檔，
 * next/image 本來就不需要 remotePatterns。
 */
export function isAllowedImageUrl(
  url: string | null | undefined,
): url is string {
  if (!url) return false;
  if (url.startsWith("/")) return true;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(parsed.hostname)
    );
  } catch {
    // 連 URL 都 parse 不出來（打到一半的網址就是這種）
    return false;
  }
}

/** 給表單的錯誤訊息用 —— 直接把可用的網域列給使用者，不要讓他猜 */
export const ALLOWED_IMAGE_HOSTS_HINT = ALLOWED_IMAGE_HOSTS.join("、");
