import { NextResponse } from "next/server";
import { savePost } from "../../../../lib/posts";

export async function POST(request) {
  const { page, week, content, published } = await request.json();

  try {
    await savePost({ page, week: week ?? null, content, published });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
