import { proxyToSpring } from "@/lib/spring-proxy";

/** 新增票種 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/events/${id}/ticket-types`, "POST");
}
