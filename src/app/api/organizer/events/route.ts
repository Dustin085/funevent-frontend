import { proxyToSpring } from "@/lib/spring-proxy";

/** 建立活動（草稿） */
export async function POST(request: Request) {
  return proxyToSpring(request, "/api/events", "POST");
}
