import { NextResponse } from "next/server";
import { saveSubscription } from "../../../../lib/push";

export async function POST(request) {
  const { subscription, isAdmin } = await request.json();

  try {
    await saveSubscription(subscription, Boolean(isAdmin));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
