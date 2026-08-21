import { proxyToSpring } from "@/lib/spring-proxy";

/** 刪除票種。後端會擋「已有訂單」與「票種不屬於這個活動」 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketTypeId: string }> },
) {
  const { id, ticketTypeId } = await params;
  return proxyToSpring(
    request,
    `/api/events/${id}/ticket-types/${ticketTypeId}`,
    "DELETE",
  );
}
