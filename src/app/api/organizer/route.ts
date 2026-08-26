import { proxyToSpring } from "@/lib/spring-proxy";

/** 建立主辦者身分 */
export async function POST(request: Request) {
  return proxyToSpring(request, "/api/organizers", "POST");
}

/** 修改主辦單位的名稱與介紹 */
export async function PATCH(request: Request) {
  return proxyToSpring(request, "/api/organizers/me", "PATCH");
}
