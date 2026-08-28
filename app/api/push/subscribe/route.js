import { NextResponse } from "next/server";
import { saveSubscription } from "../../../../lib/push";

export async function POST(request) {
  const { subscription } = await request.json();

  try {
    await saveSubscription(subscription);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
