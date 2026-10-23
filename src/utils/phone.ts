export interface CountryCodeOption {
  code: string;
  label: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+1", label: "+1 (US & Canada)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+61", label: "+61 (Australia)" },
  { code: "+49", label: "+49 (Germany)" },
  { code: "+33", label: "+33 (France)" },
  { code: "+34", label: "+34 (Spain)" },
  { code: "+39", label: "+39 (Italy)" },
  { code: "+31", label: "+31 (Netherlands)" },
  { code: "+353", label: "+353 (Ireland)" },
  { code: "+64", label: "+64 (New Zealand)" },
  { code: "+52", label: "+52 (Mexico)" },
  { code: "+55", label: "+55 (Brazil)" },
  { code: "+81", label: "+81 (Japan)" },
  { code: "+91", label: "+91 (India)" },
  { code: "+65", label: "+65 (Singapore)" },
  { code: "+27", label: "+27 (South Africa)" },
  { code: "+46", label: "+46 (Sweden)" },
  { code: "+41", label: "+41 (Switzerland)" },
  { code: "+852", label: "+852 (Hong Kong)" }
];

/**
 * Combines a country code and raw national mobile digits into an E.164 string (e.g. +13313731030).
 */
export function formatE164Phone(countryCode: string, rawNumber: string): string {
  let digits = (rawNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  const cleanCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const codeDigits = cleanCode.replace(/\D/g, '');
  if (digits.startsWith(codeDigits)) {
    digits = digits.slice(codeDigits.length);
  }
  return `${cleanCode}${digits}`;
}

/**
 * Parses an existing E.164 or stored phone string into its country code and national digits.
 */
export function splitPhone(fullNumber?: string | null): { countryCode: string; nationalNumber: string } {
  if (!fullNumber) return { countryCode: "+1", nationalNumber: "" };
  const trimmed = fullNumber.trim();
  const sortedPrefixes = COUNTRY_CODES.map(c => c.code).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (trimmed.startsWith(prefix)) {
      return { countryCode: prefix, nationalNumber: trimmed.slice(prefix.length) };
    }
  }
  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})(.*)$/);
    if (match) {
      return { countryCode: match[1], nationalNumber: match[2] };
    }
  }
  return { countryCode: "+1", nationalNumber: trimmed };
}

/**
 * Strips whitespace, dashes, and formatting characters from an incoming E.164 payload for Twilio dispatch.
 */
export function cleanTwilioPhone(rawPhone: string): string {
  const stripped = rawPhone.replace(/[\s\-()]/g, '');
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}
