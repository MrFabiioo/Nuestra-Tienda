const NUMERIC_DB_DATE_PATTERN = /^-?\d+(?:\.\d+)?$/;

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

export function serializeDbDate(date: Date): string {
  return date.toISOString();
}

export function normalizeDbDate(value: unknown): Date | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (NUMERIC_DB_DATE_PATTERN.test(trimmed)) {
      const numericDate = new Date(Number(trimmed));
      if (isValidDate(numericDate)) {
        return numericDate;
      }
    }

    const date = new Date(trimmed);
    return isValidDate(date) ? date : null;
  }

  return null;
}
