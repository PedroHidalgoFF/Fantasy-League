import { NextResponse } from "next/server";
import { sendPushToAdmin } from "../../../../lib/push";

export async function POST() {
  try {
    const result = await sendPushToAdmin({
      title: "🔔 Test notification",
      body: "If you're seeing this, push notifications are working.",
      url: "/",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
