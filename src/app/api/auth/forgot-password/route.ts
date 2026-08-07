import { ApiError, MessageResponse } from "@/lib/api-types";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "請求格式錯誤" }, { status: 400 });
  }

  let springResponse: Response;
  // 打 API 到 Spring 後端
  try {
    springResponse = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: "無法連線到伺服器，請稍後再試" },
      { status: 502 },
    );
  }

  // Spring 回傳錯誤
  if (!springResponse.ok) {
    const error: ApiError = await springResponse.json();
    return NextResponse.json(error, { status: springResponse.status });
  }

  const message: MessageResponse = await springResponse.json();

  return NextResponse.json(message);
}
