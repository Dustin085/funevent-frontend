import { proxyToSpring } from "@/lib/spring-proxy";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToSpring(request, `/api/users/me/comments/${id}`, "DELETE");
}
