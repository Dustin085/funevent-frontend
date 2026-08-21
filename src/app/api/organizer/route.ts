import { proxyToSpring } from "@/lib/spring-proxy";

/** 建立主辦者身分 */
export async function POST(request: Request) {
  return proxyToSpring(request, "/api/organizers", "POST");
}
