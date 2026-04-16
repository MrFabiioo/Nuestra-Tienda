import { Chart, registerables } from 'chart.js';

type AnalyticsSummary = {
  totalOrders: number;
  totalRevenue: number;
  approvedRevenue: number;
  avgOrderValue: number;
  totalItemsSold: number;
  approvedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
};

type AnalyticsSeriesItem = { label: string; count: number };
type AnalyticsByDayItem = { date: string; orders: number; revenue: number };
type AnalyticsTopItem = { title: string; qty: number; revenue: number };
type AnalyticsEstimatedProfitItem = AnalyticsTopItem & {
  estimatedCost: number;
  estimatedProfit: number;
  estimatedUnitCost: number;
  estimatedRevenue: number;
};
type AnalyticsByHourItem = { hour: number; count: number };

export type AdminAnalyticsDashboardData = {
  summary: AnalyticsSummary;
  byDay: AnalyticsByDayItem[];
  topByQty: AnalyticsTopItem[];
  topByRevenue: AnalyticsTopItem[];
  topByEstimatedProfit: AnalyticsEstimatedProfitItem[];
  byDayOfWeek: Array<{ dayName: string; count: number }>;
  byHour: AnalyticsByHourItem[];
  byStatus: AnalyticsSeriesItem[];
  byPaymentMethod: AnalyticsSeriesItem[];
  neverOrdered: Array<{ id: string; title: string; price: number }>;
  profitabilityCoverage: {
    rankedProducts: number;
    productsWithoutEstimatedCost: number;
  };
};

type AnalyticsPalette = ReturnType<typeof buildPalette>;
type DashboardMetricTone = 'default' | 'accent' | 'warning';

type DashboardMetric = {
  label: string;
  value: string;
  sub: string;
  tone: DashboardMetricTone;
  icon: string;
};

type DashboardNarrative = {
  title: string;
  description: string;
  tone: DashboardMetricTone;
};

type HorizontalBarChartOptions = {
  id: string;
  labels: string[];
  values: number[];
  datasetLabel: string;
  primary: string;
  soft: string;
  tooltipLabel: (value: number, label: string, index: number) => string | string[];
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
  'chart-top-profit',
  'chart-payment',
  'chart-dow',
  'chart-hour',
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente pago',
  under_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

const TEMPORAL_WARNINGS = [
  'Usá estas vistas para detectar concentración de demanda por día y franja horaria.',
  'Combiná esta lectura con el pipeline y el mix operativo para decidir refuerzos, cobertura y prioridades.',
  'Las métricas de monto bruto e histórico NO equivalen a caja confirmada salvo que el pedido esté aprobado.',
];

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
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,50,11,0.14)',
    text: isDark ? 'rgba(241,243,249,0.74)' : 'rgba(24,50,11,0.72)',
    textStrong: isDark ? 'rgba(241,243,249,0.94)' : 'rgba(24,50,11,0.90)',
  };
}

function applyChartDefaults(palette: AnalyticsPalette) {
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = palette.text;
}

function currency(value: number | null | undefined) {
  return '$' + Number(value ?? 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInteger(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-CO');
}

function truncate(label: string, max = 26) {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toPercent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function labelStatus(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function withShare(items: Array<{ label: string; count: number }>) {
  const total = items.reduce((acc, item) => acc + item.count, 0);

  return items.map((item) => ({
    ...item,
    share: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
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

function buildExecutiveMetrics(data: AdminAnalyticsDashboardData): DashboardMetric[] {
  const { summary, neverOrdered } = data;
  const approvedShare = toPercent(summary.approvedOrders, summary.totalOrders);
  const pendingShare = toPercent(summary.pendingOrders, summary.totalOrders);

  return [
    {
      label: 'Facturación confirmada',
      value: currency(summary.approvedRevenue),
      sub: `${formatInteger(summary.approvedOrders)} pedidos aprobados · base para caja confirmada`,
      tone: 'accent',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Demanda bruta registrada',
      value: currency(summary.totalRevenue),
      sub: 'Pedidos históricos totales, sin filtrar por aprobación',
      tone: 'default',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      label: 'Conversión a aprobado',
      value: `${approvedShare}%`,
      sub: `${formatInteger(summary.approvedOrders)} de ${formatInteger(summary.totalOrders)} pedidos terminaron aprobados`,
      tone: 'accent',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      label: 'Pendientes por resolver',
      value: formatInteger(summary.pendingOrders),
      sub: summary.pendingOrders > 0
        ? `${pendingShare}% del pipeline todavía espera resolución`
        : 'Sin backlog operativo ahora mismo',
      tone: summary.pendingOrders > 0 ? 'warning' : 'default',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Productos sin movimiento',
      value: formatInteger(neverOrdered.length),
      sub: neverOrdered.length > 0
        ? 'Productos publicados que todavía no registran pedidos'
        : 'Todo el catálogo ya registró pedidos',
      tone: neverOrdered.length > 0 ? 'warning' : 'default',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
  ];
}

function buildExecutiveNarrative(data: AdminAnalyticsDashboardData): DashboardNarrative[] {
  const { summary, neverOrdered } = data;
  const confirmedVsGrossShare = toPercent(summary.approvedRevenue, summary.totalRevenue);

  return [
    {
      title: 'Caja confirmada vs. demanda histórica',
      description: summary.totalRevenue > 0
        ? `${confirmedVsGrossShare}% del monto bruto histórico ya está respaldado por pedidos aprobados.`
        : 'Todavía no hay demanda histórica suficiente para comparar caja confirmada y demanda bruta.',
      tone: 'accent',
    },
    {
      title: 'Carga operativa inmediata',
      description: summary.pendingOrders > 0
        ? `${formatInteger(summary.pendingOrders)} pedidos siguen pendientes entre pago y revisión; conviene atacarlos antes de leer el resto del tablero como ingreso real.`
        : 'Sin pedidos pendientes ahora mismo, así que el pipeline operativo está limpio.',
      tone: summary.pendingOrders > 0 ? 'warning' : 'default',
    },
    {
      title: 'Señal de catálogo',
      description: neverOrdered.length > 0
        ? `${formatInteger(neverOrdered.length)} productos todavía no tuvieron pedidos; esto sugiere revisar visibilidad, precio o surtido.`
        : 'Todo el catálogo ya tuvo al menos un pedido, así que no hay productos completamente inmóviles.',
      tone: neverOrdered.length > 0 ? 'warning' : 'default',
    },
  ];
}

function buildExecutiveHighlights(summary: AnalyticsSummary) {
  const approvedShare = toPercent(summary.approvedOrders, summary.totalOrders);
  const pendingShare = toPercent(summary.pendingOrders, summary.totalOrders);
  const rejectedShare = toPercent(summary.rejectedOrders, summary.totalOrders);

  return [
    {
      label: 'Aprobación',
      value: `${approvedShare}%`,
      detail: `${formatInteger(summary.approvedOrders)} de ${formatInteger(summary.totalOrders)} pedidos`,
    },
    {
      label: 'Pendientes',
      value: formatInteger(summary.pendingOrders),
      detail: pendingShare > 0 ? `${pendingShare}% del pipeline` : 'Sin backlog actual',
    },
    {
      label: 'Rechazos',
      value: `${rejectedShare}%`,
      detail: `${formatInteger(summary.rejectedOrders)} pedidos caídos`,
    },
  ];
}

function renderMetricCard(metric: DashboardMetric) {
  const toneClass = metric.tone === 'accent'
    ? 'analytics-metric-card--accent'
    : metric.tone === 'warning'
      ? 'analytics-metric-card--warning'
      : '';
  const iconToneClass = metric.tone === 'warning' ? 'analytics-metric-card__icon--warning' : '';

  return `
    <div class="analytics-metric-card ${toneClass}">
      <div class="analytics-metric-card__icon ${iconToneClass}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="${metric.icon}" />
        </svg>
      </div>
      <p class="analytics-metric-card__label">${escapeHtml(metric.label)}</p>
      <p class="analytics-metric-card__value">${escapeHtml(metric.value)}</p>
      <p class="analytics-metric-card__sub">${escapeHtml(metric.sub)}</p>
    </div>
  `;
}

function renderNarrativeCard(item: DashboardNarrative) {
  const toneClass = item.tone === 'accent'
    ? 'analytics-story-card--accent'
    : item.tone === 'warning'
      ? 'analytics-story-card--warning'
      : '';

  return `
    <article class="analytics-story-card ${toneClass}">
      <p class="analytics-story-card__title">${escapeHtml(item.title)}</p>
      <p class="analytics-story-card__description">${escapeHtml(item.description)}</p>
    </article>
  `;
}

function renderLoadingShell() {
  return `
    <div class="analytics-dashboard-state" role="status" aria-live="polite">
      <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        ${Array.from({ length: 5 }, () => `
          <div class="analytics-metric-card analytics-skeleton-card">
            <div class="analytics-skeleton analytics-skeleton--icon"></div>
            <div class="analytics-skeleton analytics-skeleton--label"></div>
            <div class="analytics-skeleton analytics-skeleton--value"></div>
            <div class="analytics-skeleton analytics-skeleton--sub"></div>
          </div>
        `).join('')}
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        ${Array.from({ length: 4 }, () => `
          <div class="analytics-panel analytics-skeleton-panel">
            <div class="analytics-panel__header">
              <div class="analytics-skeleton analytics-skeleton--icon"></div>
              <div class="analytics-panel__heading analytics-skeleton-stack">
                <div class="analytics-skeleton analytics-skeleton--label"></div>
                <div class="analytics-skeleton analytics-skeleton--title"></div>
                <div class="analytics-skeleton analytics-skeleton--sub"></div>
              </div>
            </div>
            <div class="analytics-panel__body">
              <div class="analytics-skeleton analytics-skeleton--chart"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderErrorState(message: string) {
  return `
    <div class="analytics-dashboard-state">
      <div class="analytics-alert analytics-alert--warning" role="alert">
        <strong>No pudimos cargar analytics:</strong>
        ${escapeHtml(message)}
      </div>
      <div class="mt-4 flex flex-wrap gap-3">
        <button type="button" id="analytics-retry-button" class="filter-submit">Reintentar carga</button>
        <a href="/admin/dashboard" class="premium-action-secondary">Volver al dashboard</a>
      </div>
    </div>
  `;
}

function renderDashboardMarkup(data: AdminAnalyticsDashboardData) {
  const metrics = buildExecutiveMetrics(data);
  const narrative = buildExecutiveNarrative(data);
  const executiveHighlights = buildExecutiveHighlights(data.summary);
  const statusMix = withShare(data.byStatus.map((item) => ({ ...item, label: labelStatus(item.label) })));
  const paymentMix = withShare(data.byPaymentMethod);
  const profitTotal = data.topByEstimatedProfit.reduce((sum, item) => sum + item.estimatedProfit, 0);
  const profitMix = data.topByEstimatedProfit.map((item) => ({
    ...item,
    share: profitTotal > 0 ? Math.round((item.estimatedProfit / profitTotal) * 100) : 0,
  }));
  const profitCoverageCopy = data.profitabilityCoverage.productsWithoutEstimatedCost > 0
    ? ` Se excluyeron ${formatInteger(data.profitabilityCoverage.productsWithoutEstimatedCost)} producto${data.profitabilityCoverage.productsWithoutEstimatedCost === 1 ? '' : 's'} sin costo estimable.`
    : '';

  return `
    <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      ${metrics.map(renderMetricCard).join('')}
    </div>

    <div class="mt-6 grid gap-3 lg:grid-cols-3">
      ${narrative.map(renderNarrativeCard).join('')}
    </div>

    <div class="mt-6">
      <div class="analytics-panel analytics-panel--warning">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap analytics-panel__icon-wrap--warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow analytics-panel__eyebrow--warning">Tendencia ejecutiva</p>
            <h2 class="analytics-panel__title">Demanda diaria bruta y volumen de pedidos</h2>
            <p class="analytics-panel__description">Serie diaria del período consultado para seguir ritmo comercial y volumen de pedidos.</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          <div class="analytics-alert analytics-alert--warning" role="alert">
            <strong>Lectura temporal:</strong>
            La serie diaria te ayuda a detectar ritmo comercial y evolución de pedidos a lo largo del tiempo.
          </div>
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            ${executiveHighlights.map((item) => `
              <div class="analytics-mini-stat">
                <p class="analytics-mini-stat__label">${escapeHtml(item.label)}</p>
                <p class="analytics-mini-stat__value">${escapeHtml(item.value)}</p>
                <p class="analytics-mini-stat__detail">${escapeHtml(item.detail)}</p>
              </div>
            `).join('')}
          </div>
          <div class="chart-wrap chart-wrap--tall mt-5">
            <canvas id="chart-trend" aria-label="Serie diaria de demanda bruta y pedidos"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <div class="analytics-panel">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow">Pipeline comercial</p>
            <h2 class="analytics-panel__title">Pipeline por estado del pedido</h2>
            <p class="analytics-panel__description">Sirve para ver cuánta demanda está aprobada, trabada o caída.</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          ${statusMix.length === 0 ? '<p class="analytics-empty">Todavía no hay pedidos para construir el pipeline.</p>' : `
            <ul class="analytics-breakdown-list">
              ${statusMix.map((item) => `
                <li class="analytics-breakdown-item">
                  <div>
                    <p class="analytics-breakdown-item__label">${escapeHtml(item.label)}</p>
                    <p class="analytics-breakdown-item__sub">${formatInteger(item.count)} pedidos · ${item.share}% del total</p>
                  </div>
                  <span class="analytics-breakdown-item__value">${item.share}%</span>
                </li>
              `).join('')}
            </ul>
            <div class="chart-wrap chart-wrap--medium mt-5">
              <canvas id="chart-status" aria-label="Pipeline por estado del pedido"></canvas>
            </div>
          `}
        </div>
      </div>

      <div class="analytics-panel">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow">Productos · demanda</p>
            <h2 class="analytics-panel__title">Top 10 por unidades demandadas</h2>
            <p class="analytics-panel__description">Cuenta ítems en pedidos del período consultado, no ventas netas confirmadas.</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          ${data.topByQty.length === 0 ? '<p class="analytics-empty">Sin historial suficiente para rankear productos todavía.</p>' : `
            <div class="chart-wrap chart-wrap--medium">
              <canvas id="chart-top-qty" aria-label="Top productos por unidades demandadas"></canvas>
            </div>
          `}
        </div>
      </div>

      <div class="analytics-panel">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow">Productos · valor histórico</p>
            <h2 class="analytics-panel__title">Top 10 por monto bruto histórico</h2>
            <p class="analytics-panel__description">Valor acumulado por producto dentro del período consultado; incluye pedidos no aprobados mientras no filtremos por estado.</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          ${data.topByRevenue.length === 0 ? '<p class="analytics-empty">Sin historial suficiente para medir valor histórico por producto.</p>' : `
            <div class="chart-wrap chart-wrap--medium">
              <canvas id="chart-top-rev" aria-label="Top productos por monto bruto histórico"></canvas>
            </div>
          `}
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="analytics-panel">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow">Mix operativo</p>
            <h2 class="analytics-panel__title">Mix por método de pago</h2>
            <p class="analytics-panel__description">Comparación directa para detectar dependencia operativa por método.</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          ${paymentMix.length === 0 ? '<p class="analytics-empty">Todavía no hay pagos registrados para comparar métodos.</p>' : `
            <ul class="analytics-inline-list">
              ${paymentMix.map((item) => `<li>${escapeHtml(item.label)}: ${item.share}%</li>`).join('')}
            </ul>
            <div class="chart-wrap chart-wrap--medium mt-4">
              <canvas id="chart-payment" aria-label="Comparación por método de pago"></canvas>
            </div>
          `}
        </div>
      </div>

      <div class="analytics-panel">
        <div class="analytics-panel__header">
          <div class="analytics-panel__icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="analytics-panel__heading">
            <p class="analytics-panel__eyebrow">Productos · rentabilidad estimada</p>
            <h2 class="analytics-panel__title">Top productos por ganancia estimada</h2>
            <p class="analytics-panel__description">Ranking comparativo con solo pedidos aprobados; ingreso aprobado menos costo estimado con receta actual.${escapeHtml(profitCoverageCopy)}</p>
          </div>
        </div>
        <div class="analytics-panel__body">
          ${profitMix.length === 0 ? '<p class="analytics-empty">Todavía no hay productos con costo estimable y pedidos aprobados para rankear rentabilidad.</p>' : `
            <ul class="analytics-breakdown-list analytics-breakdown-list--compact">
              ${profitMix.map((item) => `
                <li class="analytics-breakdown-item analytics-breakdown-item--sm">
                  <div>
                    <p class="analytics-breakdown-item__label">${escapeHtml(item.title)}</p>
                    <p class="analytics-breakdown-item__sub">${formatInteger(item.qty)} unid. · ${item.share}% del total</p>
                  </div>
                  <span class="analytics-breakdown-item__value">${escapeHtml(currency(item.estimatedProfit))}</span>
                </li>
              `).join('')}
              <li class="analytics-breakdown-item analytics-breakdown-item--sm analytics-breakdown-item--total">
                <div>
                  <p class="analytics-breakdown-item__label">Ganancia total estimada</p>
                  <p class="analytics-breakdown-item__sub">${formatInteger(profitMix.length)} producto${profitMix.length === 1 ? '' : 's'} rankeados</p>
                </div>
                <span class="analytics-breakdown-item__value">${escapeHtml(currency(profitTotal))}</span>
              </li>
            </ul>
            <div class="chart-wrap chart-wrap--medium">
              <canvas id="chart-top-profit" aria-label="Top productos por ganancia estimada"></canvas>
            </div>
          `}
        </div>
      </div>
    </div>

    ${data.neverOrdered.length > 0 ? `
      <div class="mt-6">
        <div class="analytics-panel analytics-panel--warning">
          <div class="analytics-panel__header">
            <div class="analytics-panel__icon-wrap analytics-panel__icon-wrap--warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div class="analytics-panel__heading">
              <p class="analytics-panel__eyebrow analytics-panel__eyebrow--warning">Acción de catálogo</p>
              <h2 class="analytics-panel__title">Productos sin movimiento histórico <span class="analytics-count-badge analytics-count-badge--warning">${formatInteger(data.neverOrdered.length)}</span></h2>
              <p class="analytics-panel__description">Este bloque sí es accionable hoy: revisar visibilidad, precio, copy o continuidad del producto.</p>
            </div>
          </div>
          <div class="analytics-panel__body">
            <div class="admin-table-scroll">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Acción sugerida</th>
                    <th>Ir al detalle</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.neverOrdered.map((product) => `
                    <tr>
                      <td>
                        <p class="font-semibold" style="color: var(--color-text);">${escapeHtml(product.title)}</p>
                        <p class="text-xs" style="color: var(--color-text-subtle);">Sin pedidos históricos registrados</p>
                      </td>
                      <td class="text-sm" style="color: var(--color-text-muted);">Revisar posicionamiento, precio o continuidad en catálogo.</td>
                      <td><a href="/admin/products/${encodeURIComponent(product.id)}" class="premium-action-secondary text-xs">Editar producto</a></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="mt-6 analytics-panel">
      <div class="analytics-panel__header">
        <div class="analytics-panel__icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7.5 14.25l3-3 2.25 2.25 4.5-5.25" />
          </svg>
        </div>
        <div class="analytics-panel__heading">
          <p class="analytics-panel__eyebrow">Patrones temporales</p>
          <h2 class="analytics-panel__title">Lectura de demanda por día y hora</h2>
          <p class="analytics-panel__description">Leé día de semana, hora y evolución diaria para detectar concentración de demanda y momentos de mayor actividad.</p>
        </div>
      </div>
      <div class="analytics-panel__body">
        <div class="analytics-alert" role="status">
          <ul class="analytics-breakdown-list">
            ${TEMPORAL_WARNINGS.map((warning) => `<li class="analytics-inline-list__item">${escapeHtml(warning)}</li>`).join('')}
          </ul>
        </div>
        <div class="mt-5 grid gap-6 lg:grid-cols-2">
          <div class="analytics-temporal-card">
            <p class="analytics-temporal-card__eyebrow">Día de semana</p>
            <h3 class="analytics-temporal-card__title">Pedidos por día de la semana</h3>
            <p class="analytics-temporal-card__description">Te ayuda a ver qué días concentran más pedidos y demanda histórica.</p>
            <div class="chart-wrap chart-wrap--small mt-4">
              <canvas id="chart-dow" aria-label="Pedidos por día de la semana"></canvas>
            </div>
          </div>
          <div class="analytics-temporal-card">
            <p class="analytics-temporal-card__eyebrow">Hora</p>
            <h3 class="analytics-temporal-card__title">Pedidos por hora del día</h3>
            <p class="analytics-temporal-card__description">Te muestra en qué franjas horarias se concentra la demanda.</p>
            <div class="chart-wrap chart-wrap--small mt-4">
              <canvas id="chart-hour" aria-label="Pedidos por hora del día"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getDashboardHost(root: Document) {
  return root.getElementById('analytics-dashboard-root');
}

function writeAnalyticsData(root: Document, data: AdminAnalyticsDashboardData) {
  let script = root.getElementById('analytics-data') as HTMLScriptElement | null;

  if (!script) {
    script = root.createElement('script');
    script.id = 'analytics-data';
    script.type = 'application/json';
    root.body.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
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
      labels: options.labels.map((label) => truncate(label)),
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
            title: (items) => options.labels[items[0]?.dataIndex ?? 0] ?? '',
            label: (context) => options.tooltipLabel(
              Number(context.parsed.x ?? 0),
              options.labels[context.dataIndex] ?? '',
              context.dataIndex,
            ),
          },
        },
      },
      scales: {
        x: {
          ...baseScale,
          ticks: options.valueFormatter
            ? { ...baseScale.ticks, callback: (value) => options.valueFormatter?.(Number(value)) }
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
        backgroundColor: options.values.map((value) => value === maxValue ? options.primary : options.soft),
        borderColor: options.values.map((value) => value === maxValue ? options.primary : options.primary),
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
            label: (context) => ` ${Number(context.parsed.y ?? 0)} pedido${Number(context.parsed.y ?? 0) === 1 ? '' : 's'}`,
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

  const labels = data.byDay.map((item) => {
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
          data: data.byDay.map((item) => item.revenue),
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
          data: data.byDay.map((item) => item.orders),
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
            label: (context) => context.datasetIndex === 0
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
          ticks: { ...baseScale.ticks, callback: (value) => currency(Number(value)) },
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

export function renderAdminAnalyticsDashboardLoading(root: Document = document) {
  const host = getDashboardHost(root);
  if (!host) return;

  destroyAdminAnalyticsDashboard(root);
  host.innerHTML = renderLoadingShell();
}

export function renderAdminAnalyticsDashboardError(message: string, root: Document = document) {
  const host = getDashboardHost(root);
  if (!host) return;

  destroyAdminAnalyticsDashboard(root);
  host.innerHTML = renderErrorState(message);
}

export function renderAdminAnalyticsDashboard(data: AdminAnalyticsDashboardData, root: Document = document) {
  const host = getDashboardHost(root);
  if (!host) return;

  host.innerHTML = renderDashboardMarkup(data);
  writeAnalyticsData(root, data);
  initAdminAnalyticsDashboard(root, data);
}

export function initAdminAnalyticsDashboard(root: Document = document, initialData?: AdminAnalyticsDashboardData | null) {
  const data = initialData ?? readAnalyticsData(root);

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
    labels: data.byStatus.map((item) => labelStatus(item.label)),
    values: data.byStatus.map((item) => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.accentStrong,
    soft: palette.accentSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} pedido${value === 1 ? '' : 's'}`,
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-top-qty',
    labels: data.topByQty.map((item) => item.title),
    values: data.topByQty.map((item) => item.qty),
    datasetLabel: 'Unidades demandadas',
    primary: palette.blue,
    soft: palette.blueSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} unidad${value === 1 ? '' : 'es'}`,
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-top-rev',
    labels: data.topByRevenue.map((item) => item.title),
    values: data.topByRevenue.map((item) => item.revenue),
    datasetLabel: 'Monto bruto',
    primary: palette.teal,
    soft: palette.tealSoft,
    tooltipLabel: (value, label) => ` ${label}: ${currency(value)}`,
    valueFormatter: (value) => currency(value),
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-top-profit',
    labels: data.topByEstimatedProfit.map((item) => item.title),
    values: data.topByEstimatedProfit.map((item) => item.estimatedProfit),
    datasetLabel: 'Ganancia estimada',
    primary: palette.teal,
    soft: palette.tealSoft,
    tooltipLabel: (value, _label, index) => {
      const item = data.topByEstimatedProfit[index];

      if (!item) {
        return ` Ganancia estimada: ${currency(value)}`;
      }

      return [
        ` Ingreso aprobado: ${currency(item.estimatedRevenue)}`,
        ` Costo estimado: ${currency(item.estimatedCost)}`,
        ` Ganancia estimada: ${currency(item.estimatedProfit)}`,
      ];
    },
    valueFormatter: (value) => currency(value),
  });

  createHorizontalBarChart(root, palette, {
    id: 'chart-payment',
    labels: data.byPaymentMethod.map((item) => item.label),
    values: data.byPaymentMethod.map((item) => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.blue,
    soft: palette.blueSoft,
    tooltipLabel: (value, label) => ` ${label}: ${value} pedido${value === 1 ? '' : 's'}`,
  });

  createVerticalBarChart(root, palette, {
    id: 'chart-dow',
    labels: data.byDayOfWeek.map((item) => item.dayName.slice(0, 3)),
    values: data.byDayOfWeek.map((item) => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.warning,
    soft: palette.warningSoft,
  });

  createVerticalBarChart(root, palette, {
    id: 'chart-hour',
    labels: data.byHour.map((item) => `${item.hour.toString().padStart(2, '0')}h`),
    values: data.byHour.map((item) => item.count),
    datasetLabel: 'Pedidos',
    primary: palette.red,
    soft: palette.redSoft,
  });

  return () => destroyAdminAnalyticsDashboard(root);
}
