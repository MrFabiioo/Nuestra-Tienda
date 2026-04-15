/**
 * GET /admin/analytics-export?from=YYYY-MM-DD&to=YYYY-MM-DD&label=string
 *
 * Generates and streams an Excel (.xlsx) file with analytics data
 * filtered to the requested date range.
 *
 * Protected by middleware (all /admin/* routes require auth).
 *
 * Date semantics:
 *   - `from` / `to` are calendar dates in the business timezone (America/Bogota UTC-5).
 *   - Both are inclusive: from 2026-04-07 to 2026-04-13 → all orders on those 7 days.
 *   - The endpoint converts them to UTC timestamps for the SQL filter.
 */

import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { getAnalyticsData } from '../../services/analytics/repository';
import { BUSINESS_TIMEZONE_OFFSET_HOURS } from '../../services/analytics/business-timezone';
import { formatPaymentMethod } from '../../services/orders/constants';

export const prerender = false;

/**
 * Converts a YYYY-MM-DD calendar date (in business timezone) to a UTC Date.
 * `endOfDay=true` → start of NEXT calendar day (exclusive upper bound).
 */
function businessDateToUTC(dateStr: string, endOfDay = false): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (endOfDay) d.setUTCDate(d.getUTCDate() + 1);
  // Bogotá UTC-5 → "midnight Bogotá" = "05:00 UTC"
  d.setUTCHours(d.getUTCHours() - BUSINESS_TIMEZONE_OFFSET_HOURS);
  return d;
}

function safeFilename(label: string): string {
  return label.replace(/[^a-z0-9\-_]/gi, '-').replace(/-+/g, '-').slice(0, 50);
}

/** Auto-width columns based on max content length */
function autoColWidths(data: unknown[][]): XLSX.ColInfo[] {
  if (!data.length) return [];
  const maxCols = Math.max(...data.map((r) => (r as unknown[]).length));
  return Array.from({ length: maxCols }, (_, col) => {
    const max = data.reduce((acc, row) => {
      const cell = String((row as unknown[])[col] ?? '');
      return Math.max(acc, cell.length);
    }, 6);
    return { wch: Math.min(max + 2, 45) };
  });
}

function makeSheet(data: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = autoColWidths(data);
  return ws;
}

export const GET: APIRoute = async ({ url, locals }) => {
  // Middleware guarantees auth for /admin/* — but double-check for API safety
  if (!locals.user) {
    return new Response('No autorizado', { status: 401 });
  }

  const fromParam = url.searchParams.get('from');
  const toParam   = url.searchParams.get('to');
  const label     = url.searchParams.get('label') ?? 'periodo';

  if (!fromParam || !toParam) {
    return new Response('Parámetros "from" y "to" requeridos (YYYY-MM-DD)', { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromParam) || !/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
    return new Response('Formato de fecha inválido. Usar YYYY-MM-DD', { status: 400 });
  }

  const from = businessDateToUTC(fromParam, false);
  const to   = businessDateToUTC(toParam, true);  // exclusive upper bound

  if (from >= to) {
    return new Response('"from" debe ser anterior a "to"', { status: 400 });
  }

  const data = await getAnalyticsData({ from, to });

  // ── Build workbook ──────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen ────────────────────────────────────────────────
  const summarySheet = makeSheet([
    ['Período', `${fromParam} → ${toParam}`],
    ['Exportado', new Date().toISOString()],
    [],
    ['Métrica', 'Valor'],
    ['Total pedidos',          data.summary.totalOrders],
    ['Revenue total ($)',      data.summary.totalRevenue],
    ['Revenue aprobado ($)',   data.summary.approvedRevenue],
    ['Ticket promedio ($)',    data.summary.avgOrderValue],
    ['Unidades vendidas',      data.summary.totalItemsSold],
    ['Pedidos aprobados',      data.summary.approvedOrders],
    ['Pedidos pendientes',     data.summary.pendingOrders],
    ['Pedidos rechazados',     data.summary.rejectedOrders],
    [
      'Tasa de aprobación (%)',
      data.summary.totalOrders > 0
        ? Math.round((data.summary.approvedOrders / data.summary.totalOrders) * 100)
        : 0,
    ],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');

  // ── Sheet 2: Tendencia diaria ───────────────────────────────────────
  const dailyRows: unknown[][] = [['Fecha', 'Pedidos', 'Revenue ($)']];
  data.byDay.forEach(d => dailyRows.push([d.date, d.orders, d.revenue]));
  XLSX.utils.book_append_sheet(wb, makeSheet(dailyRows), 'Por día');

  // ── Sheet 3: Día de semana ─────────────────────────────────────────
  const dowRows: unknown[][] = [['Día', 'Pedidos', 'Revenue ($)']];
  data.byDayOfWeek.forEach(d => dowRows.push([d.dayName, d.count, d.revenue]));
  XLSX.utils.book_append_sheet(wb, makeSheet(dowRows), 'Día de semana');

  // ── Sheet 4: Hora del día ──────────────────────────────────────────
  const hourRows: unknown[][] = [['Hora (negocio)', 'Pedidos']];
  data.byHour.forEach(h => hourRows.push([`${String(h.hour).padStart(2, '0')}:00`, h.count]));
  XLSX.utils.book_append_sheet(wb, makeSheet(hourRows), 'Hora del día');

  // ── Sheet 5: Top productos por cantidad ────────────────────────────
  const topQtyRows: unknown[][] = [['#', 'Producto', 'Unidades vendidas', 'Revenue ($)']];
  data.topByQty.forEach((p, i) => topQtyRows.push([i + 1, p.title, p.qty, p.revenue]));
  XLSX.utils.book_append_sheet(wb, makeSheet(topQtyRows), 'Top prod. (cant.)');

  // ── Sheet 6: Top productos por revenue ─────────────────────────────
  const topRevRows: unknown[][] = [['#', 'Producto', 'Revenue ($)', 'Unidades']];
  data.topByRevenue.forEach((p, i) => topRevRows.push([i + 1, p.title, p.revenue, p.qty]));
  XLSX.utils.book_append_sheet(wb, makeSheet(topRevRows), 'Top prod. (revenue)');

  // ── Sheet 7: Métodos de pago ───────────────────────────────────────
  const payTotal = data.byPaymentMethod.reduce((s, p) => s + p.count, 0);
  const payRows: unknown[][] = [['Método', 'Pedidos', 'Participación (%)']];
  data.byPaymentMethod.forEach(p => {
    payRows.push([
      p.label,
      p.count,
      payTotal > 0 ? Math.round((p.count / payTotal) * 100) : 0,
    ]);
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(payRows), 'Métodos de pago');

  // ── Sheet 8: Estados de pedidos ────────────────────────────────────
  const statusLabels: Record<string, string> = {
    pending_payment: 'Pendiente pago',
    under_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
  };
  const statusTotal = data.byStatus.reduce((s, p) => s + p.count, 0);
  const statusRows: unknown[][] = [['Estado', 'Pedidos', 'Participación (%)']];
  data.byStatus.forEach(s => {
    statusRows.push([
      statusLabels[s.label] ?? s.label,
      s.count,
      statusTotal > 0 ? Math.round((s.count / statusTotal) * 100) : 0,
    ]);
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(statusRows), 'Estados');

  // ── Generate buffer ─────────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `analytics-${safeFilename(label)}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
