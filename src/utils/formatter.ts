export class Formatter {
  static currency(value: number, decimals = 2): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'cop',
      maximumFractionDigits: decimals,
    }).format(value);
  }
}