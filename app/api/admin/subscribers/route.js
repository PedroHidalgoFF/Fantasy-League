import { NextResponse } from "next/server";
import { getSubscriberCounts } from "../../../../lib/push";

export async function GET() {
  const counts = await getSubscriberCounts();
  return NextResponse.json(counts);
}
