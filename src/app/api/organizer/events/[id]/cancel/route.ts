import { proxyToSpring } from "@/lib/spring-proxy";

/** 取消活動。後端會擋「已有付款完成的訂單」 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/cancel`, "PATCH");
}
