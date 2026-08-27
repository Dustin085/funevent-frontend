import { proxyToSpring } from "@/lib/spring-proxy";

/**
 * ⚠️ 沒有 GET —— 初始的收藏狀態由 Server Component 在伺服器端讀好、
 * 當 prop 傳給按鈕，瀏覽器不需要自己再查一次。
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/favorite`, "PUT");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/favorite`, "DELETE");
}
