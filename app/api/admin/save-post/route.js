import { NextResponse } from "next/server";
import { savePost } from "../../../../lib/posts";
import { sendPushToAll } from "../../../../lib/push";

export async function POST(request) {
  const { page, week, content, published } = await request.json();

  try {
    await savePost({ page, week: week ?? null, content, published });

    if (published) {
      const url = page === "home" ? "/" : "/weekly-report";
      const preview = content.length > 100 ? `${content.slice(0, 100)}…` : content;

      try {
        await sendPushToAll({ title: "New post from the league", body: preview, url });
      } catch (err) {
        console.error("Push send failed:", err.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
