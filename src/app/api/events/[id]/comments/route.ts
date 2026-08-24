import { proxyToSpring } from "@/lib/spring-proxy";

/**
 * 送出評論。
 *
 * ⚠️ 資格規則（買過票、活動已開始、一人一則）全部在後端 ——
 * 這裡只轉發，被拒絕的訊息原封不動回給前端顯示。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/comments`, "POST");
}
