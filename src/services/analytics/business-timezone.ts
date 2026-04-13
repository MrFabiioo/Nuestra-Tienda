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
