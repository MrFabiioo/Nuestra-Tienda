/**
 * Server-side chart renderer for Excel exports.
 *
 * Uses @napi-rs/canvas (prebuilt binaries, no compilation needed) +
 * Chart.js to generate PNG buffers that are embedded in the Excel workbook.
 *
 * Performance notes:
 *  - Chart.js registration happens once via module-level singleton.
 *  - All charts are rendered in parallel via Promise.all in the caller.
 *  - animation: false is required — server has no event loop for animations.
 *  - responsive: false is required — no DOM to measure container size.
 */

import { createCanvas } from '@napi-rs/canvas';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import type { AnalyticsData } from './repository';

// ── One-time Chart.js setup ────────────────────────────────────────────────
let _registered = false;
function ensureRegistered() {
  if (_registered) return;
  Chart.register(...registerables);
  _registered = true;
}

// ── Export palette (light mode) ────────────────────────────────────────────
const P = {
  accent:      '#6BA32A',
  accentSoft:  'rgba(107,163,42,0.20)',
  accentStrong:'#4A7A1A',
  warning:     '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.20)',
  blue:        '#0077BB',
  blueSoft:    'rgba(0,119,187,0.20)',
  teal:        '#009988',
  tealSoft:    'rgba(0,153,136,0.20)',
  red:         '#CC3311',
  redSoft:     'rgba(204,51,17,0.20)',
  grid:        'rgba(0,0,0,0.10)',
  text:        'rgba(30,30,30,0.72)',
  textStrong:  'rgba(30,30,30,0.90)',
  bg:          '#FFFFFF',
};

// ── Core renderer ──────────────────────────────────────────────────────────

async function renderChart(config: ChartConfiguration, width = 900, height = 380): Promise<Buffer> {
  ensureRegistered();

  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  // White background
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, width, height);

  const chart = new Chart(ctx as unknown as CanvasRenderingContext2D, config);
  const buffer = canvas.toBuffer('image/png');
  chart.destroy();

  return buffer as Buffer;
}

// ── Shared scale defaults ──────────────────────────────────────────────────

const baseScale = {
  grid:  { color: P.grid },
  ticks: { color: P.text, font: { size: 11 } },
};

const baseTooltip = {
  backgroundColor: '#FFFFFF',
  borderColor:     'rgba(0,0,0,0.12)',
  borderWidth:     1,
  titleColor:      P.textStrong,
  bodyColor:       P.text,
  padding:         10,
  cornerRadius:    8,
};

function truncate(s: string, max = 28) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function currency(v: number) {
  return '$' + v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Chart builders ─────────────────────────────────────────────────────────

export async function renderTrendChart(data: AnalyticsData): Promise<Buffer> {
  const labels  = data.byDay.map(d => { const [,m,day] = d.date.split('-'); return `${day}/${m}`; });
  return renderChart({
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue bruto ($)',
          data:  data.byDay.map(d => d.revenue),
          borderColor:     P.accent,
          backgroundColor: P.accentSoft,
          borderWidth: 2.5,
          pointRadius: 3,
          tension: 0.35,
          fill: true,
          yAxisID: 'yRev',
        },
        {
          label: 'Pedidos',
          data:  data.byDay.map(d => d.orders),
          borderColor:     P.warning,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.35,
          fill: false,
          yAxisID: 'yOrders',
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: {
        legend: { labels: { color: P.textStrong, font: { size: 11 } } },
        tooltip: { ...baseTooltip },
      },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, maxRotation: 45, maxTicksLimit: 15 } },
        yRev:    { ...baseScale, position: 'left',  ticks: { ...baseScale.ticks, callback: v => currency(Number(v)) } },
        yOrders: { ...baseScale, position: 'right', grid: { drawOnChartArea: false }, ticks: { ...baseScale.ticks, stepSize: 1 } },
      },
    },
  }, 960, 400);
}

export async function renderDayOfWeekChart(data: AnalyticsData): Promise<Buffer> {
  const maxVal = Math.max(...data.byDayOfWeek.map(d => d.count), 1);
  return renderChart({
    type: 'bar',
    data: {
      labels:   data.byDayOfWeek.map(d => d.dayName.slice(0, 3)),
      datasets: [{
        label: 'Pedidos',
        data:  data.byDayOfWeek.map(d => d.count),
        backgroundColor: data.byDayOfWeek.map(d => d.count === maxVal ? P.warning : P.warningSoft),
        borderColor:     P.warning,
        borderWidth: 1.2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
      scales: {
        x: { ...baseScale },
        y: { ...baseScale, ticks: { ...baseScale.ticks, stepSize: 1 } },
      },
    },
  }, 600, 340);
}

export async function renderHourChart(data: AnalyticsData): Promise<Buffer> {
  const maxVal = Math.max(...data.byHour.map(d => d.count), 1);
  return renderChart({
    type: 'bar',
    data: {
      labels:   data.byHour.map(d => `${String(d.hour).padStart(2,'0')}h`),
      datasets: [{
        label: 'Pedidos',
        data:  data.byHour.map(d => d.count),
        backgroundColor: data.byHour.map(d => d.count === maxVal ? P.red : P.redSoft),
        borderColor:     P.red,
        borderWidth: 1.2,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, font: { size: 9 }, maxRotation: 0 } },
        y: { ...baseScale, ticks: { ...baseScale.ticks, stepSize: 1 } },
      },
    },
  }, 960, 320);
}

export async function renderTopQtyChart(data: AnalyticsData): Promise<Buffer> {
  if (!data.topByQty.length) return renderEmptyChart('Sin datos de demanda por cantidad');
  return renderChart({
    type: 'bar',
    data: {
      labels:   data.topByQty.map(d => truncate(d.title)),
      datasets: [{
        label: 'Unidades',
        data:  data.topByQty.map(d => d.qty),
        backgroundColor: data.topByQty.map((_, i) => i === 0 ? P.blue : P.blueSoft),
        borderColor:     P.blue,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, stepSize: 1 } },
        y: { ...baseScale },
      },
    },
  }, 700, 360);
}

export async function renderTopRevenueChart(data: AnalyticsData): Promise<Buffer> {
  if (!data.topByRevenue.length) return renderEmptyChart('Sin datos de revenue por producto');
  return renderChart({
    type: 'bar',
    data: {
      labels:   data.topByRevenue.map(d => truncate(d.title)),
      datasets: [{
        label: 'Revenue ($)',
        data:  data.topByRevenue.map(d => d.revenue),
        backgroundColor: data.topByRevenue.map((_, i) => i === 0 ? P.teal : P.tealSoft),
        borderColor:     P.teal,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => ` ${currency(Number(ctx.parsed.x))}` } } },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, callback: v => currency(Number(v)) } },
        y: { ...baseScale },
      },
    },
  }, 700, 360);
}

export async function renderPaymentChart(data: AnalyticsData): Promise<Buffer> {
  if (!data.byPaymentMethod.length) return renderEmptyChart('Sin pagos registrados');
  const colors = [P.blue, P.teal, P.accent, P.warning, P.red, P.accentStrong];
  return renderChart({
    type: 'doughnut',
    data: {
      labels:   data.byPaymentMethod.map(d => d.label),
      datasets: [{
        data:            data.byPaymentMethod.map(d => d.count),
        backgroundColor: data.byPaymentMethod.map((_, i) => colors[i % colors.length]),
        borderColor:     '#FFFFFF',
        borderWidth:     2,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: {
        legend: { position: 'right', labels: { color: P.textStrong, font: { size: 11 }, padding: 12 } },
        tooltip: { ...baseTooltip },
      },
    },
  }, 560, 320);
}

export async function renderStatusChart(data: AnalyticsData): Promise<Buffer> {
  if (!data.byStatus.length) return renderEmptyChart('Sin pedidos registrados');
  const statusColors: Record<string, string> = {
    'Aprobado':        P.accent,
    'Pendiente pago':  P.warning,
    'En revisión':     P.blue,
    'Rechazado':       P.red,
    'Cancelado':       'rgba(100,100,100,0.5)',
  };
  return renderChart({
    type: 'bar',
    data: {
      labels:   data.byStatus.map(d => d.label),
      datasets: [{
        label: 'Pedidos',
        data:  data.byStatus.map(d => d.count),
        backgroundColor: data.byStatus.map(d => statusColors[d.label] ?? P.accentSoft),
        borderColor:     data.byStatus.map(d => statusColors[d.label] ?? P.accent),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
      scales: {
        x: { ...baseScale },
        y: { ...baseScale, ticks: { ...baseScale.ticks, stepSize: 1 } },
      },
    },
  }, 600, 320);
}

// ── Fallback for empty data ────────────────────────────────────────────────

async function renderEmptyChart(message: string): Promise<Buffer> {
  ensureRegistered();
  const w = 400, h = 200;
  const canvas = createCanvas(w, h);
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font      = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, w / 2, h / 2);
  return canvas.toBuffer('image/png') as Buffer;
}
