import { ApiError, UserResponse } from "@/lib/api-types";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

export async function GET() {
  let springResponse: Response;
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/users/me`);
  } catch {
    return NextResponse.json(
      { message: "無法連線到伺服器，請稍後再試" },
      { status: 502 },
    );
  }

  if (!springResponse.ok) {
    const error: ApiError = await springResponse.json();
    return NextResponse.json(error, { status: springResponse.status });
  }

  const user: UserResponse = await springResponse.json();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
