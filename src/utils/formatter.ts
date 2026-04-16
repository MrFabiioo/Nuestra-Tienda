import { normalizeDbDate } from './db-date';

export class Formatter {
  static currency(value: number, decimals = 2): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'cop',
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Formatea una fecha proveniente de db.run() — puede ser Date, número (Unix ms)
   * o string ISO. Si el valor es inválido devuelve el fallback.
   */
  static dateTime(value: unknown, fallback = 'Sin fecha', locale = 'es-CO'): string {
    const date = normalizeDbDate(value);
    return date ? date.toLocaleString(locale) : fallback;
  }
}
