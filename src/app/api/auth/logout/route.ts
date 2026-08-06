import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/auth-cookie";

/**
 * 登出：清除 httpOnly cookie。
 *
 * 不需要呼叫 Spring —— JWT 是無狀態的，後端沒有「session」可以銷毀。
 * 「登出」在這個架構下就等於「把客戶端手上的 token 拿掉」。
 */
export async function POST() {
  await clearTokenCookie();
  return NextResponse.json({ ok: true });
}