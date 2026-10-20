import { NextResponse } from "next/server";
import { POST as handleInvite } from "../route";

export const dynamic = 'force-dynamic';

/**
 * Strips all non-numeric characters from a mobile number and formats it to E.164 standard.
 * If 10 digits (US), automatically prepends +1.
 */
export function formatTwilioE164(mobileNumber: string): string {
  const digitsOnly = mobileNumber.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  return `+${digitsOnly}`;
}

export async function POST(req: Request) {
  return handleInvite(req);
}
