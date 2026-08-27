import { proxyToSpring } from "@/lib/spring-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(
    request,
    `/api/organizers/me/events/${id}/check-in`,
    "POST",
  );
}
