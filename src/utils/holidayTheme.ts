export interface HolidayConfig {
  id: string;
  name: string;
  seasonal_tag: string;
  month?: number; // 1-12
  day?: number; // 1-31
  bgHex: string;
  textHex: string;
  bgColor: string; // convenience alias
  accentColor: string; // convenience alias
  icon: string;
  instruction: string;
}

export const DEFAULT_THEME = {
  bgHex: '#09090b', // Tailwind bg-zinc-950
  textHex: '#ef4444', // Tailwind text-red-500
  bgColor: '#09090b',
  accentColor: '#ef4444',
};

/**
 * Calculates the date of Thanksgiving (4th Thursday in November) for any given year.
 */
export function getThanksgivingDate(year: number): Date {
  // November is month index 10 (0-indexed)
  const novFirst = new Date(year, 10, 1);
  const dayOfWeek = novFirst.getDay(); // 0 = Sun, 4 = Thu
  const dayOffset = (4 - dayOfWeek + 7) % 7;
  const fourthThursday = 1 + dayOffset + 21;
  return new Date(year, 10, fourthThursday);
}

export const US_HOLIDAYS: HolidayConfig[] = [
  {
    id: 'valentines',
    name: "Valentine's Day",
    seasonal_tag: 'valentines',
    month: 2,
    day: 14,
    bgHex: '#1a050f',
    textHex: '#f43f5e',
    bgColor: '#1a050f',
    accentColor: '#f43f5e',
    icon: '💖',
    instruction: "Subtly weave in thematic elements appropriate for Valentine's Day."
  },
  {
    id: 'st_patricks',
    name: "St. Patrick's Day",
    seasonal_tag: 'st_patricks',
    month: 3,
    day: 17,
    bgHex: '#03170a',
    textHex: '#10b981',
    bgColor: '#03170a',
    accentColor: '#10b981',
    icon: '🍀',
    instruction: "Subtly weave in thematic elements appropriate for St. Patrick's Day."
  },
  {
    id: 'july_4th',
    name: 'July 4th',
    seasonal_tag: 'july_4th',
    month: 7,
    day: 4,
    bgHex: '#050e22',
    textHex: '#38bdf8',
    bgColor: '#050e22',
    accentColor: '#38bdf8',
    icon: '🎆',
    instruction: 'Subtly weave in thematic elements appropriate for July 4th.'
  },
  {
    id: 'halloween',
    name: 'Halloween',
    seasonal_tag: 'halloween',
    month: 10,
    day: 31,
    bgHex: '#140902',
    textHex: '#f97316',
    bgColor: '#140902',
    accentColor: '#f97316',
    icon: '🎃',
    instruction: 'Subtly weave in thematic elements appropriate for Halloween.'
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    seasonal_tag: 'thanksgiving',
    bgHex: '#180c04',
    textHex: '#d97706',
    bgColor: '#180c04',
    accentColor: '#d97706',
    icon: '🍂',
    instruction: 'Subtly weave in thematic elements appropriate for Thanksgiving.'
  },
  {
    id: 'christmas',
    name: 'Christmas',
    seasonal_tag: 'christmas',
    month: 12,
    day: 25,
    bgHex: '#05170d',
    textHex: '#dc2626',
    bgColor: '#05170d',
    accentColor: '#dc2626',
    icon: '🎄',
    instruction: 'Subtly weave in thematic elements appropriate for Christmas.'
  },
  {
    id: 'new_years_eve',
    name: "New Year's Eve",
    seasonal_tag: 'new_years_eve',
    month: 12,
    day: 31,
    bgHex: '#0d0b16',
    textHex: '#eab308',
    bgColor: '#0d0b16',
    accentColor: '#eab308',
    icon: '🥂',
    instruction: "Subtly weave in thematic elements appropriate for New Year's Eve."
  }
];

export const HOLIDAYS = US_HOLIDAYS;

export const HOLIDAY_THEMES: Record<string, { bgHex: string; textHex: string; bgColor: string; accentColor: string }> = {
  valentines: { bgHex: '#1a050f', textHex: '#f43f5e', bgColor: '#1a050f', accentColor: '#f43f5e' },
  st_patricks: { bgHex: '#03170a', textHex: '#10b981', bgColor: '#03170a', accentColor: '#10b981' },
  july_4th: { bgHex: '#050e22', textHex: '#38bdf8', bgColor: '#050e22', accentColor: '#38bdf8' },
  halloween: { bgHex: '#140902', textHex: '#f97316', bgColor: '#140902', accentColor: '#f97316' },
  thanksgiving: { bgHex: '#180c04', textHex: '#d97706', bgColor: '#180c04', accentColor: '#d97706' },
  christmas: { bgHex: '#05170d', textHex: '#dc2626', bgColor: '#05170d', accentColor: '#dc2626' },
  new_years_eve: { bgHex: '#0d0b16', textHex: '#eab308', bgColor: '#0d0b16', accentColor: '#eab308' },
};

/**
 * Returns the exact holiday date for a given year.
 */
export function getHolidayDate(holiday: HolidayConfig, year: number): Date {
  if (holiday.id === 'thanksgiving') {
    return getThanksgivingDate(year);
  }
  return new Date(year, (holiday.month ?? 1) - 1, holiday.day ?? 1);
}

/**
 * Checks whether the specified date falls within the 7-day active window
 * (6 days prior, plus the day of the holiday) for the given holiday.
 */
export function isHolidayActive(holiday: HolidayConfig, date: Date = new Date()): boolean {
  const currentYear = date.getFullYear();

  // Check current year, and adjacent years in case of year boundaries
  for (const year of [currentYear, currentYear - 1, currentYear + 1]) {
    const hDate = getHolidayDate(holiday, year);
    
    // Window start: 6 days prior at 00:00:00.000
    const start = new Date(hDate.getFullYear(), hDate.getMonth(), hDate.getDate() - 6, 0, 0, 0, 0);
    // Window end: day of holiday at 23:59:59.999
    const end = new Date(hDate.getFullYear(), hDate.getMonth(), hDate.getDate(), 23, 59, 59, 999);

    const time = date.getTime();
    if (time >= start.getTime() && time <= end.getTime()) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the currently active holiday, or null if outside any holiday window.
 * When Christmas and New Year's Eve windows overlap (Dec 25), Christmas is prioritized on Dec 25.
 */
export function getActiveHoliday(date: Date = new Date()): HolidayConfig | null {
  // If Christmas is active and date is Dec 25, Christmas takes priority
  const christmas = US_HOLIDAYS.find(h => h.id === 'christmas')!;
  if (isHolidayActive(christmas, date)) {
    // If it's on or before Christmas day, prioritize Christmas
    const cDate = getHolidayDate(christmas, date.getFullYear());
    const cEnd = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), 23, 59, 59, 999);
    if (date.getTime() <= cEnd.getTime()) {
      return christmas;
    }
  }

  for (const holiday of US_HOLIDAYS) {
    if (holiday.id === 'christmas') continue; // already evaluated
    if (isHolidayActive(holiday, date)) {
      return holiday;
    }
  }

  if (isHolidayActive(christmas, date)) {
    return christmas;
  }

  return null;
}

/**
 * Returns the active holiday theme, or null if no holiday window is active.
 */
export function getActiveHolidayTheme(date: Date = new Date()): HolidayConfig | null {
  return getActiveHoliday(date);
}

/**
 * Alias for getActiveHolidayTheme.
 */
export function getCurrentHolidayTheme(date: Date = new Date()): HolidayConfig | null {
  return getActiveHoliday(date);
}

/**
 * Returns the hidden instruction string to append to AI system prompts,
 * or null if no holiday is active.
 */
export function getHolidayPromptInstruction(date: Date = new Date()): string | null {
  const active = getActiveHoliday(date);
  return active ? active.instruction : null;
}
