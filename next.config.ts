import type { NextConfig } from "next";
import { ALLOWED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  images: {
    /**
     * 主辦者貼進來的圖片網址，next/image 只會去抓這裡列出的網域。
     *
     * ⭐ 清單從 src/lib/image-hosts.ts 來，那裡是唯一的來源 ——
     * 表單的驗證與每個渲染點的守門也用同一份，不會分岔。
     *
     * ⚠️ 絕對不要寫 hostname: "**"，理由見 image-hosts.ts。
     */
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
