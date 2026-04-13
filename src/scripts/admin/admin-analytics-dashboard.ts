import { Chart, registerables } from 'chart.js';

type AnalyticsSeriesItem = { label: string; count: number };
type AnalyticsByDayItem = { date: string; orders: number; revenue: number };
type AnalyticsTopItem = { title: string; qty: number; revenue: number };
type AnalyticsByHourItem = { hour: number; count: number };

type AdminAnalyticsDashboardData = {
  byDay: AnalyticsByDayItem[];
  topByQty: AnalyticsTopItem[];
  topByRevenue: AnalyticsTopItem[];
  byDayOfWeek: Array<{ dayName: string; count: number }>;
  byHour: AnalyticsByHourItem[];
  byStatus: AnalyticsSeriesItem[];
  byPaymentMethod: AnalyticsSeriesItem[];
  byDeliveryMethod: AnalyticsSeriesItem[];
};

type AnalyticsPalette = ReturnType<typeof buildPalette>;

type HorizontalBarChartOptions = {
  id: string;
  labels: string[];
  values: number[];
  datasetLabel: string;
  primary: string;
  soft: string;
  tooltipLabel: (value: number, label: string) => string;
  valueFormatter?: (value: number) => string;
};

type VerticalBarChartOptions = {
  id: string;
  labels: string[];
  values: number[];
  datasetLabel: string;
  primary: string;
  soft: string;
};

export type AdminAnalyticsDashboardLifecycle = {
  mount: (root?: Document) => () => void;
  destroy: (root?: Document) => void;
};

const KNOWN_CHART_IDS = [
  'chart-trend',
  'chart-status',
  'chart-top-qty',
  'chart-top-rev',
  'chart-payment',
  'chart-delivery',
  'chart-dow',
  'chart-hour',
] as const;

const activeChartIds = new Set<string>();

let chartJsRegistered = false;

function ensureChartJsRegistered() {
  if (chartJsRegistered) {
    return;
  }

  Chart.register(...registerables);
  chartJsRegistered = true;
}

function buildPalette(isDark: boolean) {
  return {
    accent: isDark ? '#84a903' : '#6BA32A',
    accentSoft: isDark ? 'rgba(132,169,3,0.25)' : 'rgba(107,163,42,0.22)',
    accentStrong: isDark ? '#9BC53D' : '#4A7A1A',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.24)',
    blue: '#0077BB',
    blueSoft: 'rgba(0,119,187,0.24)',
    teal: '#009988',
    tealSoft: 'rgba(0,153,136,0.24)',
    red: '#CC3311',
    redSoft: 'rgba(204,51,17,0.24)',
    magenta: '#EE3377',
    magentaSoft: 'rgba(238,51,119,0.24)',
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    text: isDark ? 'rgba(241,243,249,0.74)' : 'rgba(0,0,0,0.56)',
    textStrong: isDark ? 'rgba(241,243,249,0.94)' : 'rgba(0,0,0,0.76)',
  };
}

function applyChartDefaults(palette: AnalyticsPalette) {
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = palette.text;
}

function currency(value: number | null | undefined) {
  return '$' + Number(value ?? 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncate(label: string, max = 26) {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

function getCanvas(root: Document, id: string) {
  return root.getElementById(id) as HTMLCanvasElement | null;
}

function getCtx(root: Document, id: string) {
  return getCanvas(root, id)?.getContext('2d') ?? null;
}

function buildBarColors(length: number, primary: string, soft: string) {
  return Array.from({ length }, (_, index) => (index === 0 ? primary : soft));
}

function readAnalyticsData(root: Document): AdminAnalyticsDashboardData | null {
  const raw = root.getElementById('analytics-data')?.textContent;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminAnalyticsDashboardData;
  } catch {
    return null;
  }
}

function destroyChart(root: Document, id: string) {
  const canvas = getCanvas(root, id);
  const chart = canvas ? Chart.getChart(canvas) : Chart.getChart(id);

  if (chart) {
    chart.destroy();
  }

  activeChartIds.delete(id);
}

function rememberChart(id: string, chart: Chart) {
  activeChartIds.add(id);
  return chart;
}

function createHorizontalBarChart(root: Document, palette: AnalyticsPalette, options: HorizontalBarChartOptions) {
  const ctx = getCtx(root, options.id);

  if (!ctx || options.values.length === 0) {
    return null;
  }

  destroyChart(root, options.id);

  const baseScale = {
    grid: { color: palette.grid, drawBorder: false },
    ticks: { color: palette.text },
  };

  const tooltip = {
    backgroundColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#1a1a1a' : '#ffffff',
    borderColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    titleColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#f3f4f6' : '#111827',
    bodyColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#9ca3af' : '#6b7280',
    padding: 10,
    cornerRadius: 10,
    displayColors: true,
    boxPadding: 4,
  };

  return rememberChart(options.id, new Chart(ctx, {
    type: 'bar',
    data: {
      labels: options.labels.map(label => truncate(label)),
      datasets: [{
        label: options.datasetLabel,
        data: options.values,
        backgroundColor: buildBarColors(options.values.length, options.primary, options.soft),
        borderColor: buildBarColors(options.values.length, options.primary, options.primary),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip,
          callbacks: {
            title: items => options.labels[items[0]?.dataIndex ?? 0] ?? '',
            label: context => options.tooltipLabel(Number(context.parsed.x ?? 0), options.labels[context.dataIndex] ?? ''),
          },
        },
      },
      scales: {
        x: {
          ...baseScale,
          ticks: options.valueFormatter
            ? { ...baseScale.ticks, callback: value => options.valueFormatter?.(Number(value)) }
            : { ...baseScale.ticks, stepSize: 1 },
        },
        y: { ...baseScale },
      },
    },
  }));
}

function createVerticalBarChart(root: Document, palette: AnalyticsPalette, options: VerticalBarChartOptions) {
  const ctx = getCtx(root, options.id);

  if (!ctx || options.values.length === 0) {
    return null;
  }

  destroyChart(root, options.id);

  const maxValue = Math.max(...options.values, 1);
  const baseScale = {
    grid: { color: palette.grid, drawBorder: false },
    ticks: { color: palette.text },
  };

  const tooltip = {
    backgroundColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#1a1a1a' : '#ffffff',
    borderColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    titleColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#f3f4f6' : '#111827',
    bodyColor: palette.textStrong === 'rgba(241,243,249,0.94)' ? '#9ca3af' : '#6b7280',
    padding: 10,
    cornerRadius: 10,
    displayColors: true,
    boxPadding: 4,
  };

  return rememberChart(options.id, new Chart(ctx, {
    type: 'bar',
    data: {
      labels: options.labels,
      datasets: [{
        label: options.datasetLabel,
        data: options.values,
        backgroundColor: options.values.map(value => value === maxValue ? options.primary : options.soft),
        borderColor: options.values.map(value => value === maxValue ? options.primary : options.primary),
        borderWidth: 1.2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: context => ` ${Number(context.parsed.y ?? 0)} pedido${Number(context.parsed.y ?? 0) === 1 ? '' : 's'}`,
          },
        },
      },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, maxRotation: 0, font: { size: 10 } } },
        y: { ...baseScale, ticks: { ...baseScale.ticks, stepSize: 1 } },
      },
    },
  }));
}

function createTrendChart(root: Document, data: AdminAnalyticsDashboardData, palette: AnalyticsPalette) {
  const trendCtx = getCtx(root, 'chart-trend');

  if (!trendCtx || data.byDay.length === 0) {
    return null;
  }

  destroyChart(root, 'chart-trend');

  const labels = data.byDay.map(item => {
    const [, month, day] = item.date.split('-');
    return `${day}/${month}`;
  });

  const isDark = root.documentElement.dataset.theme === 'dark';
  const baseScale = {
    grid: { color: palette.grid, drawBorder: false },
    ticks: { color: palette.text },
  };

  const tooltip = {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    titleColor: isDark ? '#f3f4f6' : '#111827',
    bodyColor: isDark ? '#9ca3af' : '#6b7280',
    padding: 10,
    cornerRadius: 10,
    displayColors: true,
    boxPadding: 4,
  };

  return rememberChart('chart-trend', new Chart(trendCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Monto bruto histórico',
          data: data.byDay.map(item => item.revenue),
          borderColor: palette.accent,
          backgroundColor: palette.accentSoft,
          borderWidth: 2.5,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: palette.accent,
          tension: 0.35,
          fill: true,
          yAxisID: 'yRevenue',
        },
        {
          label: 'Pedidos',
          data: data.byDay.map(item => item.orders),
          borderColor: palette.warning,
          backgroundColor: palette.warningSoft,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: palette.warning,
          tension: 0.35,
          fill: false,
          yAxisID: 'yOrders',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: palette.textStrong, boxWidth: 12, padding: 16 } },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: context => context.datasetIndex === 0
              ? ` Monto bruto: ${currency(Number(context.parsed.y ?? 0))}`
              : ` Pedidos: ${Number(context.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: { ...baseScale, ticks: { ...baseScale.ticks, maxRotation: 45, maxTicksLimit: 15 } },
        yRevenue: {
          ...baseScale,
          position: 'left',
          ticks: { ...baseScale.ticks, callback: value => currency(Number(value)) },
        },
        yOrders: {
          ...baseScale,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { ...baseScale.ticks, stepSize: 1 },
        },
      },
    },
  }));
}

export function destroyAdminAnalyticsDashboard(root: Document = document) {
  for (const id of KNOWN_CHART_IDS) {
    destroyChart(root, id);
  }
}

export function initAdminAnalyticsDashboard(root: Document = document) {
  const data = readAnalyticsData(root);

  if (!data) {
    destroyAdminAnalyticsDashboard(root);
    return () => destroyAdminAnalyticsDashboard(root);
  }

  ensureChartJsRegistered();

  const palette = buildPalette(root.documentElement.dataset.theme === 'dark');
  applyChartDefaults(palette);
  destroyAdminAnalyticsDashboard(root);

  createTrendChart(root, data, palette);

  createHorizontalBarChart(root, palette, {
    id: 'chart-status',
    labels: data.byStatus.map(item => item.label),
    values: data.byStatus.map(item => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.accentStrong,
    soft: palette.accentSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} pedido${value === 1 ? '' : 's'}`,
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-top-qty',
    labels: data.topByQty.map(item => item.title),
    values: data.topByQty.map(item => item.qty),
    datasetLabel: 'Unidades demandadas',
    primary: palette.blue,
    soft: palette.blueSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} unidad${value === 1 ? '' : 'es'}`,
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-top-rev',
    labels: data.topByRevenue.map(item => item.title),
    values: data.topByRevenue.map(item => item.revenue),
    datasetLabel: 'Monto bruto',
    primary: palette.teal,
    soft: palette.tealSoft,
    tooltipLabel: (value, label) => ` ${label}: ${currency(value)}`,
    valueFormatter: value => currency(value),
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-payment',
    labels: data.byPaymentMethod.map(item => item.label),
    values: data.byPaymentMethod.map(item => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.blue,
    soft: palette.blueSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} pedido${value === 1 ? '' : 's'}`,
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-delivery',
    labels: data.byDeliveryMethod.map(item => item.label),
    values: data.byDeliveryMethod.map(item => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.magenta,
    soft: palette.magentaSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} pedido${value === 1 ? '' : 's'}`,
  });

  createVerticalBarChart(root, palette, {
    id: 'chart-dow',
    labels: data.byDayOfWeek.map(item => item.dayName.slice(0, 3)),
    values: data.byDayOfWeek.map(item => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.warning,
    soft: palette.warningSoft,
  });

  createVerticalBarChart(root, palette, {
    id: 'chart-hour',
    labels: data.byHour.map(item => `${item.hour.toString().padStart(2, '0')}h`),
    values: data.byHour.map(item => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.red,
    soft: palette.redSoft,
  });

  return () => destroyAdminAnalyticsDashboard(root);
}
