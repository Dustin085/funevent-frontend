import { proxyToSpring } from "@/lib/spring-proxy";

/** 更新活動 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}`, "PUT");
}
