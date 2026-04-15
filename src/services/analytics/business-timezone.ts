const HOUR_IN_MS = 60 * 60 * 1000;

export const BUSINESS_TIMEZONE = 'America/Bogota';
export const BUSINESS_TIMEZONE_LABEL = 'Medellín / Bogotá (UTC-5)';
export const BUSINESS_TIMEZONE_OFFSET_HOURS = -5;
// SQLite no resuelve zonas IANA; usamos el offset fijo del negocio.
export const BUSINESS_TIMEZONE_SQL_MODIFIER = `${BUSINESS_TIMEZONE_OFFSET_HOURS} hours`;

export function toBusinessTime(date: Date | string): Date {
  const source = typeof date === 'string' ? new Date(date) : date;
  return new Date(source.getTime() + (BUSINESS_TIMEZONE_OFFSET_HOURS * HOUR_IN_MS));
}

export function generateLast30BusinessDays(referenceDate = new Date()): string[] {
  const dates: string[] = [];
  const businessToday = new Date(`${getBusinessDayAnchor(referenceDate)}T00:00:00.000Z`);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(businessToday);
    date.setUTCDate(date.getUTCDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

export function getBusinessDayAnchor(referenceDate = new Date()): string {
  const businessToday = toBusinessTime(referenceDate);

  businessToday.setUTCHours(0, 0, 0, 0);

  return businessToday.toISOString().slice(0, 10);
}

export function getLast30BusinessDayWindow(referenceDate = new Date()) {
  const anchorDate = getBusinessDayAnchor(referenceDate);
  const dates = generateLast30BusinessDays(referenceDate);

  return {
    anchorDate,
    dates,
  };
}

/**
 * Converts a YYYY-MM-DD calendar date (in business timezone) to a UTC Date.
 *   endOfDay = false → start of that calendar day in business tz (inclusive lower bound)
 *   endOfDay = true  → start of the NEXT calendar day (exclusive upper bound)
 *
 * Example (Bogotá UTC-5):
 *   "2026-04-07" → 2026-04-07T05:00:00Z  (midnight Bogotá = 05:00 UTC)
 *   "2026-04-13" endOfDay → 2026-04-14T05:00:00Z
 */
export function businessDateToUTC(dateStr: string, endOfDay = false): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (endOfDay) d.setUTCDate(d.getUTCDate() + 1);
  // offset is negative for west timezones (Bogotá = -5), so subtract it to get UTC
  d.setUTCHours(d.getUTCHours() - BUSINESS_TIMEZONE_OFFSET_HOURS);
  return d;
}
