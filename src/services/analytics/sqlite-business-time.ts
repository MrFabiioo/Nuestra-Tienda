import { BUSINESS_TIMEZONE_SQL_MODIFIER } from './business-timezone';

function buildTrimmedTextExpression(columnExpression: string) {
  return `trim(CAST(${columnExpression} AS TEXT))`;
}

function buildNumericDatePredicate(columnExpression: string) {
  const trimmedText = buildTrimmedTextExpression(columnExpression);
  const isNumericSqlValue = `typeof(${columnExpression}) IN ('integer', 'real')`;
  const isNumericText = `(${trimmedText} <> '' AND ${trimmedText} NOT GLOB '*[^0-9.-]*' AND ${trimmedText} GLOB '*[0-9]*')`;

  return `(${isNumericSqlValue} OR ${isNumericText})`;
}

export function buildBusinessDateTimeExpression(columnExpression: string) {
  const numericDatePredicate = buildNumericDatePredicate(columnExpression);

  return `CASE
    WHEN ${numericDatePredicate}
      THEN datetime(CAST(${columnExpression} AS REAL) / 1000.0, 'unixepoch', '${BUSINESS_TIMEZONE_SQL_MODIFIER}')
    ELSE datetime(${columnExpression}, '${BUSINESS_TIMEZONE_SQL_MODIFIER}')
  END`;
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
