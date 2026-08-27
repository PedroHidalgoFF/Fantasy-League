import { NextResponse } from "next/server";
import { clearLeagueCookies } from "../../../../lib/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearLeagueCookies(response);
  return response;
}
