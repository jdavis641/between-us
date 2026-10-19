import { NextResponse } from "next/server";
import { POST as handleInvite } from "../route";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handleInvite(req);
}
