import { NextResponse } from "next/server";
import { POST as handleInvite } from "../route";
import { cleanTwilioPhone } from "@/utils/phone";

export const dynamic = 'force-dynamic';

/**
 * Strips any spaces or dashes from the incoming payload and dispatches the E.164 formatted string
 * exactly as assembled by the frontend UI.
 */
export function formatTwilioE164(mobileNumber: string): string {
  return cleanTwilioPhone(mobileNumber);
}

export async function POST(req: Request) {
  return handleInvite(req);
}
