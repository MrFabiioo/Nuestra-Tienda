import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAdminAnalyticsDashboardModel } from './admin-analytics-view-model';
import type { AnalyticsData } from './repository';

function createAnalyticsData(overrides: Partial<AnalyticsData> = {}): AnalyticsData {
  return {
    summary: {
      totalOrders: 20,
      totalRevenue: 5000,
      approvedRevenue: 3200,
      avgOrderValue: 250,
      totalItemsSold: 80,
      approvedOrders: 12,
      pendingOrders: 5,
      rejectedOrders: 3,
    },
    topByQty: [
      { productId: '1', title: 'Combo Guacamole', qty: 18, revenue: 900 },
      { productId: '2', title: 'Nachos', qty: 12, revenue: 360 },
    ],
    topByRevenue: [
      { productId: '1', title: 'Combo Guacamole', qty: 18, revenue: 900 },
      { productId: '3', title: 'Bandeja Premium', qty: 4, revenue: 720 },
    ],
    topByEstimatedProfit: [
      {
        productId: '1',
        title: 'Combo Guacamole',
        qty: 18,
        revenue: 900,
        estimatedRevenue: 900,
        estimatedCost: 420,
        estimatedProfit: 480,
        estimatedUnitCost: 23.33,
      },
      {
        productId: '3',
        title: 'Bandeja Premium',
        qty: 4,
        revenue: 720,
        estimatedRevenue: 720,
        estimatedCost: 280,
        estimatedProfit: 440,
        estimatedUnitCost: 70,
      },
    ],
    neverOrdered: [
      { id: 'prod-1', title: 'Salsa ahumada', price: 12 },
      { id: 'prod-2', title: 'Dip picante', price: 16 },
    ],
    byDayOfWeek: [
      { day: 0, dayName: 'Domingo', count: 2, revenue: 120 },
      { day: 1, dayName: 'Lunes', count: 4, revenue: 300 },
      { day: 2, dayName: 'Martes', count: 1, revenue: 80 },
      { day: 3, dayName: 'Miércoles', count: 3, revenue: 250 },
      { day: 4, dayName: 'Jueves', count: 4, revenue: 260 },
      { day: 5, dayName: 'Viernes', count: 5, revenue: 420 },
      { day: 6, dayName: 'Sábado', count: 1, revenue: 70 },
    ],
    byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 12 ? 5 : 0 })),
    byDay: Array.from({ length: 30 }, (_, index) => ({
      date: `2026-04-${String(index + 1).padStart(2, '0')}`,
      orders: index % 3,
      revenue: index * 100,
    })),
    byStatus: [
      { label: 'Aprobado', count: 12 },
      { label: 'Pendiente pago', count: 4 },
      { label: 'En revisión', count: 1 },
      { label: 'Rechazado', count: 3 },
    ],
    byPaymentMethod: [
      { label: 'Bancolombia', count: 10 },
      { label: 'Pago móvil', count: 6 },
      { label: 'Efectivo', count: 4 },
    ],
    profitabilityCoverage: {
      rankedProducts: 2,
      productsWithoutEstimatedCost: 1,
    },
    ...overrides,
  };
}

test('reorienta el dashboard hacia rentabilidad estimada por producto', () => {
  const model = buildAdminAnalyticsDashboardModel(createAnalyticsData());

  assert.deepEqual(
    model.executiveMetrics.map(metric => metric.label),
    [
      'Facturación confirmada',
      'Demanda bruta registrada',
      'Conversión a aprobado',
      'Pendientes por resolver',
      'Productos sin movimiento',
    ],
  );

  assert.equal(model.productHighlights.byEstimatedProfit.title, 'Top productos por ganancia estimada');
  assert.match(model.productHighlights.byEstimatedProfit.description, /solo pedidos aprobados/i);
  assert.match(model.productHighlights.byEstimatedProfit.description, /receta actual/i);
  assert.equal(model.mix.operationalCharts.status.chartType, 'bar');
  assert.equal(model.mix.operationalCharts.payment.chartType, 'bar');
  assert.equal(model.productHighlights.byRevenue.title, 'Top 10 por monto bruto histórico');
  assert.match(model.productHighlights.byRevenue.description, /período consultado/i);
  assert.match(model.productHighlights.byRevenue.description, /incluye pedidos no aprobados/i);
  assert.match(model.productHighlights.byQty.description, /período consultado/i);
  assert.equal(model.trend.eyebrow, 'Tendencia ejecutiva');
  assert.equal(
    model.trend.description,
    'Serie diaria del período consultado para seguir ritmo comercial y volumen de pedidos.',
  );
  assert.equal(model.temporal.notice.title, 'Patrones temporales');
  assert.equal(
    model.temporal.notice.description,
    'Leé día de semana, hora y evolución diaria para detectar concentración de demanda y momentos de mayor actividad.',
  );
  assert.equal(model.productHighlights.byEstimatedProfit.chartType, 'bar');
});

test('ajusta insights y copy cuando no hay backlog ni productos inmóviles', () => {
  const model = buildAdminAnalyticsDashboardModel(createAnalyticsData({
    summary: {
      totalOrders: 8,
      totalRevenue: 1200,
      approvedRevenue: 1200,
      avgOrderValue: 150,
      totalItemsSold: 16,
      approvedOrders: 8,
      pendingOrders: 0,
      rejectedOrders: 0,
    },
    neverOrdered: [],
    byStatus: [
      { label: 'Aprobado', count: 8 },
    ],
  }));

  const pendingMetric = model.executiveMetrics.find(metric => metric.label === 'Pendientes por resolver');
  const catalogMetric = model.executiveMetrics.find(metric => metric.label === 'Productos sin movimiento');

  assert.equal(pendingMetric?.sub, 'Sin backlog operativo ahora mismo');
  assert.equal(catalogMetric?.sub, 'Todo el catálogo ya registró pedidos');
  assert.match(model.executiveNarrative[1].description, /sin pedidos pendientes/i);
  assert.match(model.executiveNarrative[2].description, /todo el catálogo/i);
  assert.equal(model.temporal.byHour.description, 'Te muestra en qué franjas horarias se concentra la demanda.');
  assert.match(model.executiveNarrative[2].description, /todo el catálogo/i);
  assert.match(model.productHighlights.byEstimatedProfit.description, /1 producto.*sin costo estimable/i);
});
