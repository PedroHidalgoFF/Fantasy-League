import { NextResponse } from "next/server";
import { savePost } from "../../../../lib/posts";
import { sendPushToAll } from "../../../../lib/push";

// Cada page key del admin corresponde a una URL real del sitio
const PAGE_URLS = {
  home: "/",
  "power-rankings": "/power-rankings",
  "weekly-report": "/weekly-report",
  trades: "/trades",
  "waiver-wins": "/weekly-report?tab=waiver-wins",
  bustboom: "/weekly-report?tab=bustboom",
  "head-to-head": "/weekly-report?tab=head-to-head",
  teams: "/teams",
  "top-players": "/top-players",
  news: "/news",
};

export async function POST(request) {
  const { page, week, content, published } = await request.json();

  try {
    await savePost({ page, week: week ?? null, content, published });

    if (published) {
      const url = PAGE_URLS[page] || "/";
      const preview = content.length > 100 ? `${content.slice(0, 100)}…` : content;

      try {
        await sendPushToAll({ title: "A word from the Commish", body: preview, url });
      } catch (err) {
        console.error("Push send failed:", err.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
