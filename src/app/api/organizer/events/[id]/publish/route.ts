import { proxyToSpring } from "@/lib/spring-proxy";

/** 發布活動。後端會擋「沒有票種」「已開始」「不在草稿狀態」 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/publish`, "PATCH");
}
