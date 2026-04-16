/**
 * GET /admin/analytics-export?from=YYYY-MM-DD&to=YYYY-MM-DD&label=string
 *
 * Generates an Excel (.xlsx) workbook with analytics data AND embedded
 * chart images for the requested date range.
 *
 * Protected by middleware (all /admin/* routes require auth).
 *
 * Performance:
 *  - Analytics query and all chart renders run in parallel (Promise.all).
 *  - Chart.js is registered once at module level (singleton).
 *  - @napi-rs/canvas uses prebuilt binaries — no compilation needed.
 *
 * Date semantics:
 *  - from/to are calendar dates in business timezone (America/Bogota UTC-5).
 *  - Both inclusive: 2026-04-07 → 2026-04-13 covers all 7 days.
 */

import type { APIRoute } from 'astro';
import ExcelJS from 'exceljs';
import { getAnalyticsData } from '../../services/analytics/repository';
import { businessDateToUTC } from '../../services/analytics/business-timezone';
import {
  renderTrendChart,
  renderDayOfWeekChart,
  renderHourChart,
  renderTopQtyChart,
  renderTopRevenueChart,
  renderPaymentChart,
  renderStatusChart,
} from '../../services/analytics/excel-chart-renderer';

export const prerender = false;

// ── Helpers ────────────────────────────────────────────────────────────────

function safeFilename(label: string): string {
  return label.replace(/[^a-z0-9\-_]/gi, '-').replace(/-+/g, '-').slice(0, 50);
}

function isValidDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Apply consistent header row styling */
function styleHeader(row: ExcelJS.Row, bgColor = 'FF4A7A1A') {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    };
  });
  row.height = 22;
}

/** Set column widths from array of chars */
function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
}

/** Embed a PNG buffer as an image below the data table */
function addChartImage(
  wb:     ExcelJS.Workbook,
  sheet:  ExcelJS.Worksheet,
  buf:    Uint8Array,
  startRow: number,
  cols:   number,
  imgWidth  = 900,
  imgHeight = 380,
) {
  const imageId = wb.addImage({ base64: Buffer.from(buf).toString('base64'), extension: 'png' });
  sheet.addImage(imageId, {
    tl:  { col: 0, row: startRow },
    ext: { width: imgWidth, height: imgHeight },
  });
}

// ── Route handler ──────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) {
    return new Response('No autorizado', { status: 401 });
  }

  const fromParam = url.searchParams.get('from');
  const toParam   = url.searchParams.get('to');
  const label     = url.searchParams.get('label') ?? 'periodo';

  if (!isValidDate(fromParam) || !isValidDate(toParam)) {
    return new Response('Parámetros "from" y "to" requeridos (YYYY-MM-DD)', { status: 400 });
  }

  const from = businessDateToUTC(fromParam, false);
  const to   = businessDateToUTC(toParam,   true);

  if (from >= to) {
    return new Response('"from" debe ser anterior a "to"', { status: 400 });
  }

  // ── 1. Fetch analytics data ─────────────────────────────────────────
  const data = await getAnalyticsData({ from, to });

  // ── 2. Render all 7 charts in parallel ──────────────────────────────
  // Each renderXxx() call is CPU-bound canvas work. Running them in
  // parallel via Promise.all keeps total render time ~max(single chart)
  // instead of sum(all charts).
  const [
    trendChart,
    dowChart,
    hourChart,
    topQtyChart,
    topRevChart,
    paymentChart,
    statusChart,
  ] = await Promise.all([
    renderTrendChart(data),
    renderDayOfWeekChart(data),
    renderHourChart(data),
    renderTopQtyChart(data),
    renderTopRevenueChart(data),
    renderPaymentChart(data),
    renderStatusChart(data),
  ]);

  // ── Status label map ────────────────────────────────────────────────
  const statusLabels: Record<string, string> = {
    pending_payment: 'Pendiente pago',
    under_review:    'En revisión',
    approved:        'Aprobado',
    rejected:        'Rechazado',
    cancelled:       'Cancelado',
  };

  // ── Build workbook ──────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'GuacamoleSHOP Analytics';
  wb.created  = new Date();

  // ── 1. Resumen ──────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Resumen');
    setColWidths(ws, [32, 20]);

    const totalOrders = data.summary.totalOrders;
    const rows = [
      ['Período',                  `${fromParam} → ${toParam}`],
      ['Exportado',                new Date().toLocaleString('es-CO')],
      [],
      ['Métrica',                  'Valor'],
      ['Total pedidos',            totalOrders],
      ['Revenue total ($)',        data.summary.totalRevenue],
      ['Revenue aprobado ($)',     data.summary.approvedRevenue],
      ['Ticket promedio ($)',      data.summary.avgOrderValue],
      ['Unidades vendidas',        data.summary.totalItemsSold],
      ['Pedidos aprobados',        data.summary.approvedOrders],
      ['Pedidos pendientes',       data.summary.pendingOrders],
      ['Pedidos rechazados',       data.summary.rejectedOrders],
      ['Tasa aprobación (%)',      totalOrders > 0 ? Math.round((data.summary.approvedOrders / totalOrders) * 100) : 0],
    ];

    rows.forEach((r, i) => {
      const row = ws.addRow(r);
      if (i === 3) styleHeader(row, 'FF568203');
    });
  }

  // ── 2. Por día + trend chart ────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Por día');
    setColWidths(ws, [14, 12, 18]);

    styleHeader(ws.addRow(['Fecha', 'Pedidos', 'Revenue ($)']), 'FF568203');
    data.byDay.forEach(d => ws.addRow([d.date, d.orders, d.revenue]));

    const chartStartRow = data.byDay.length + 3;
    addChartImage(wb, ws, trendChart, chartStartRow, 3, 960, 400);
  }

  // ── 3. Día de semana + chart ────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Día de semana');
    setColWidths(ws, [16, 12, 18]);

    styleHeader(ws.addRow(['Día', 'Pedidos', 'Revenue ($)']), 'FF568203');
    data.byDayOfWeek.forEach(d => ws.addRow([d.dayName, d.count, d.revenue]));

    addChartImage(wb, ws, dowChart, 10, 3, 600, 340);
  }

  // ── 4. Hora del día + chart ─────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Hora del día');
    setColWidths(ws, [16, 12]);

    styleHeader(ws.addRow(['Hora', 'Pedidos']), 'FF568203');
    data.byHour.forEach(h => ws.addRow([`${String(h.hour).padStart(2,'0')}:00`, h.count]));

    addChartImage(wb, ws, hourChart, 27, 2, 960, 320);
  }

  // ── 5. Top productos (cantidad) + chart ─────────────────────────────
  {
    const ws = wb.addWorksheet('Top prod. (cant.)');
    setColWidths(ws, [4, 36, 18, 18]);

    styleHeader(ws.addRow(['#', 'Producto', 'Unidades vendidas', 'Revenue ($)']), 'FF0077BB');
    data.topByQty.forEach((p, i) => ws.addRow([i + 1, p.title, p.qty, p.revenue]));

    addChartImage(wb, ws, topQtyChart, data.topByQty.length + 3, 4, 700, 360);
  }

  // ── 6. Top productos (revenue) + chart ──────────────────────────────
  {
    const ws = wb.addWorksheet('Top prod. (revenue)');
    setColWidths(ws, [4, 36, 18, 14]);

    styleHeader(ws.addRow(['#', 'Producto', 'Revenue ($)', 'Unidades']), 'FF009988');
    data.topByRevenue.forEach((p, i) => ws.addRow([i + 1, p.title, p.revenue, p.qty]));

    addChartImage(wb, ws, topRevChart, data.topByRevenue.length + 3, 4, 700, 360);
  }

  // ── 7. Métodos de pago + chart ───────────────────────────────────────
  {
    const ws = wb.addWorksheet('Métodos de pago');
    setColWidths(ws, [24, 12, 22]);

    const total = data.byPaymentMethod.reduce((s, p) => s + p.count, 0);
    styleHeader(ws.addRow(['Método', 'Pedidos', 'Participación (%)']), 'FF568203');
    data.byPaymentMethod.forEach(p => {
      ws.addRow([p.label, p.count, total > 0 ? Math.round((p.count / total) * 100) : 0]);
    });

    addChartImage(wb, ws, paymentChart, data.byPaymentMethod.length + 3, 3, 560, 320);
  }

  // ── 8. Estados + chart ───────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Estados');
    setColWidths(ws, [22, 12, 22]);

    const labeledStatus = data.byStatus.map(s => ({
      label: statusLabels[s.label] ?? s.label,
      count: s.count,
    }));
    const total = labeledStatus.reduce((s, p) => s + p.count, 0);

    styleHeader(ws.addRow(['Estado', 'Pedidos', 'Participación (%)']), 'FF568203');
    labeledStatus.forEach(s => {
      ws.addRow([s.label, s.count, total > 0 ? Math.round((s.count / total) * 100) : 0]);
    });

    addChartImage(wb, ws, statusChart, labeledStatus.length + 3, 3, 600, 320);
  }

  // ── Stream workbook to response ──────────────────────────────────────
  const arrayBuffer = await wb.xlsx.writeBuffer();
  const filename    = `analytics-${safeFilename(label)}.xlsx`;

  return new Response(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
};
