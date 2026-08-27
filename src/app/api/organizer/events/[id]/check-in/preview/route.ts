import { proxyToSpring } from "@/lib/spring-proxy";

/** 預覽掃到的票，不改狀態 —— 給「確認核銷嗎」那個對話框用 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(
    request,
    `/api/organizers/me/events/${id}/check-in/preview`,
    "POST",
  );
}
