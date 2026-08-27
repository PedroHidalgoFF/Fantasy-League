import { NextResponse } from "next/server";
import { getDraft } from "../../../../lib/posts";

export async function POST(request) {
  const { page, week } = await request.json();
  const post = await getDraft(page, week ?? null);
  return NextResponse.json({ post });
}
