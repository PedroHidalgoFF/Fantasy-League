import { NextResponse } from "next/server";
import { sendPushToAll } from "../../../../lib/push";

export async function POST(request) {
  const { title, body } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Falta título o texto" }, { status: 400 });
  }

  try {
    const result = await sendPushToAll({ title, body, url: "/" });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
