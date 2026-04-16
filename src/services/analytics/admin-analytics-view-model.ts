import type { AnalyticsData } from './repository';
import { Formatter } from '@utils/formatter';

type DashboardMetricTone = 'default' | 'accent' | 'warning';

export interface DashboardMetric {
  label: string;
  value: string;
  sub: string;
  tone: DashboardMetricTone;
  icon: string;
}

export interface DashboardNarrative {
  title: string;
  description: string;
  tone: DashboardMetricTone;
}

interface DashboardChartMeta {
  title: string;
  description: string;
  chartType: 'line' | 'bar';
}

export interface AdminAnalyticsDashboardModel {
  executiveMetrics: DashboardMetric[];
  executiveNarrative: DashboardNarrative[];
  trend: DashboardChartMeta & {
    eyebrow: string;
  };
  productHighlights: {
    byQty: DashboardChartMeta;
    byRevenue: DashboardChartMeta;
    byEstimatedProfit: DashboardChartMeta;
  };
  mix: {
    operationalCharts: {
      status: DashboardChartMeta;
      payment: DashboardChartMeta;
    };
  };
  temporal: {
    notice: {
      title: string;
      description: string;
    };
    byDayOfWeek: DashboardChartMeta;
    byHour: DashboardChartMeta;
  };
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatPercent(value: number, total: number) {
  return `${toPercent(value, total)}%`;
}

export function buildAdminAnalyticsDashboardModel(data: AnalyticsData): AdminAnalyticsDashboardModel {
  const { summary, neverOrdered, profitabilityCoverage } = data;
  const approvedShare = formatPercent(summary.approvedOrders, summary.totalOrders);
  const pendingShare = formatPercent(summary.pendingOrders, summary.totalOrders);
  const confirmedVsGrossShare = formatPercent(summary.approvedRevenue, summary.totalRevenue);
  const profitabilityCoverageCopy = profitabilityCoverage.productsWithoutEstimatedCost > 0
    ? ` Se excluyeron ${profitabilityCoverage.productsWithoutEstimatedCost} producto${profitabilityCoverage.productsWithoutEstimatedCost === 1 ? '' : 's'} sin costo estimable.`
    : '';

  return {
    executiveMetrics: [
      {
        label: 'Facturación confirmada',
        value: Formatter.currency(summary.approvedRevenue),
        sub: `${summary.approvedOrders} pedidos aprobados · base para caja confirmada`,
        tone: 'accent',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        label: 'Demanda bruta registrada',
        value: Formatter.currency(summary.totalRevenue),
        sub: 'Pedidos históricos totales, sin filtrar por aprobación',
        tone: 'default',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        label: 'Conversión a aprobado',
        value: approvedShare,
        sub: `${summary.approvedOrders} de ${summary.totalOrders} pedidos terminaron aprobados`,
        tone: 'accent',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        label: 'Pendientes por resolver',
        value: String(summary.pendingOrders),
        sub: summary.pendingOrders > 0
          ? `${pendingShare} del pipeline todavía espera resolución`
          : 'Sin backlog operativo ahora mismo',
        tone: summary.pendingOrders > 0 ? 'warning' : 'default',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        label: 'Productos sin movimiento',
        value: String(neverOrdered.length),
        sub: neverOrdered.length > 0
          ? 'Productos publicados que todavía no registran pedidos'
          : 'Todo el catálogo ya registró pedidos',
        tone: neverOrdered.length > 0 ? 'warning' : 'default',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      },
    ],
    executiveNarrative: [
      {
        title: 'Caja confirmada vs. demanda histórica',
        description: summary.totalRevenue > 0
          ? `${confirmedVsGrossShare} del monto bruto histórico ya está respaldado por pedidos aprobados.`
          : 'Todavía no hay demanda histórica suficiente para comparar caja confirmada y demanda bruta.',
        tone: 'accent',
      },
      {
        title: 'Carga operativa inmediata',
        description: summary.pendingOrders > 0
          ? `${summary.pendingOrders} pedidos siguen pendientes entre pago y revisión; conviene atacarlos antes de leer el resto del tablero como ingreso real.`
          : 'Sin pedidos pendientes ahora mismo, así que el pipeline operativo está limpio.',
        tone: summary.pendingOrders > 0 ? 'warning' : 'default',
      },
      {
        title: 'Señal de catálogo',
        description: neverOrdered.length > 0
          ? `${neverOrdered.length} productos todavía no tuvieron pedidos; esto sugiere revisar visibilidad, precio o surtido.`
          : 'Todo el catálogo ya tuvo al menos un pedido, así que no hay productos completamente inmóviles.',
        tone: neverOrdered.length > 0 ? 'warning' : 'default',
      },
    ],
    trend: {
      eyebrow: 'Tendencia ejecutiva',
      title: 'Demanda diaria bruta y volumen de pedidos',
      description: 'Serie diaria del período consultado para seguir ritmo comercial y volumen de pedidos.',
      chartType: 'line',
    },
    productHighlights: {
      byQty: {
        title: 'Top 10 por unidades demandadas',
        description: 'Cuenta ítems en pedidos del período consultado, no ventas netas confirmadas.',
        chartType: 'bar',
      },
      byRevenue: {
        title: 'Top 10 por monto bruto histórico',
        description: 'Valor acumulado por producto dentro del período consultado; incluye pedidos no aprobados mientras no filtremos por estado.',
        chartType: 'bar',
      },
      byEstimatedProfit: {
        title: 'Top productos por ganancia estimada',
        description: `Ranking comparativo con solo pedidos aprobados; ingreso aprobado menos costo estimado con receta actual.${profitabilityCoverageCopy}`,
        chartType: 'bar',
      },
    },
    mix: {
      operationalCharts: {
        status: {
          title: 'Pipeline por estado del pedido',
          description: 'Sirve para ver cuánta demanda está aprobada, trabada o caída.',
          chartType: 'bar',
        },
        payment: {
          title: 'Mix por método de pago',
          description: 'Comparación directa para detectar dependencia operativa por método.',
          chartType: 'bar',
        },
      },
    },
    temporal: {
      notice: {
        title: 'Patrones temporales',
        description: 'Leé día de semana, hora y evolución diaria para detectar concentración de demanda y momentos de mayor actividad.',
      },
      byDayOfWeek: {
        title: 'Pedidos por día de la semana',
        description: 'Te ayuda a ver qué días concentran más pedidos y demanda histórica.',
        chartType: 'bar',
      },
      byHour: {
        title: 'Pedidos por hora del día',
        description: 'Te muestra en qué franjas horarias se concentra la demanda.',
        chartType: 'bar',
      },
    },
  };
}
