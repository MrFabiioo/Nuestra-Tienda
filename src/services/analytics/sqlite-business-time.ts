import { BUSINESS_TIMEZONE_SQL_MODIFIER } from './business-timezone';

export function buildBusinessDateTimeExpression(columnExpression: string) {
  return `datetime(${columnExpression} / 1000.0, 'unixepoch', '${BUSINESS_TIMEZONE_SQL_MODIFIER}')`;
}

export function buildBusinessDayOfWeekExpression(columnExpression: string) {
  return `CAST(strftime('%w', ${buildBusinessDateTimeExpression(columnExpression)}) AS INTEGER)`;
}

export function buildBusinessHourExpression(columnExpression: string) {
  return `CAST(strftime('%H', ${buildBusinessDateTimeExpression(columnExpression)}) AS INTEGER)`;
}

export function buildBusinessDateExpression(columnExpression: string) {
  return `date(${buildBusinessDateTimeExpression(columnExpression)})`;
}
