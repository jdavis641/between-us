import { NextResponse } from "next/server";
import { POST as handleInvite } from "../route";

export async function POST(req: Request) {
  return handleInvite(req);
}
