import { Order, OrderItem, Payment, Product, sql } from 'astro:db';
import { getLast30BusinessDayWindow, BUSINESS_TIMEZONE_OFFSET_HOURS } from './business-timezone';
import {
  buildBusinessDateExpression,
  buildBusinessDayOfWeekExpression,
  buildBusinessHourExpression,
} from './sqlite-business-time';
import { buildEstimatedProfitabilityRanking } from './estimated-profitability';
import { databaseAdapter } from '../data/database-adapter';
import type { DatabaseSession } from '../data/transaction-runner';
import { formatPaymentMethod } from '../orders/constants';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BUSINESS_DAY_OF_WEEK_SQL = sql.raw(buildBusinessDayOfWeekExpression('createdAt'));
const BUSINESS_HOUR_SQL = sql.raw(buildBusinessHourExpression('createdAt'));
const BUSINESS_DATE_SQL = sql.raw(buildBusinessDateExpression('createdAt'));

export interface DateRange {
  from: Date;
  to: Date;
}

type AnalyticsWindow = {
  fromMs: number;
  toMs: number;
  last30BusinessDayWindow: ReturnType<typeof getLast30BusinessDayWindow>;
};

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

type AnalyticsDatasets = {
  topByQty: Array<{ productId: string; title: string; qty: number; revenue: number }>;
  topByRevenue: Array<{ productId: string; title: string; qty: number; revenue: number }>;
  topByEstimatedProfit: ReturnType<typeof buildEstimatedProfitabilityRanking>['items'];
  profitabilityCoverage: {
    rankedProducts: number;
    productsWithoutEstimatedCost: ReturnType<typeof buildEstimatedProfitabilityRanking>['productsWithoutEstimatedCost'];
  };
  neverOrdered: Array<{ id: string; slug: string; title: string; price: number }>;
  byDayOfWeek: Array<{ day: number; dayName: string; count: number; revenue: number }>;
  byHour: Array<{ hour: number; count: number }>;
  byDay: Array<{ date: string; orders: number; revenue: number }>;
  byStatus: Array<{ label: string; count: number }>;
  byPaymentMethod: Array<{ label: string; count: number }>;
};

/**
 * Generates an array of YYYY-MM-DD strings in business timezone for a UTC date range.
 * `from` is the inclusive start (UTC), `to` is the exclusive end (UTC).
 */
function generateRangeDates(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const offsetMs = BUSINESS_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;

  // Convert UTC bounds to business-timezone calendar days
  const businessFrom = new Date(from.getTime() + offsetMs);
  const businessTo = new Date(to.getTime() + offsetMs - 1); // -1ms → last ms of last day

  businessFrom.setUTCHours(0, 0, 0, 0);
  businessTo.setUTCHours(0, 0, 0, 0);

  const current = new Date(businessFrom);
  while (current <= businessTo) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function resolveAnalyticsWindow(range?: DateRange): AnalyticsWindow {
  const analyticsReferenceDate = new Date();

  return {
    fromMs: range?.from.getTime() ?? 0,
    toMs: range?.to.getTime() ?? 9_999_999_999_999,
    last30BusinessDayWindow: getLast30BusinessDayWindow(analyticsReferenceDate),
  };
}

function toProductRanking(rows: unknown[]) {
  return (rows as Record<string, unknown>[]).map((row) => ({
    productId: String(row.productId),
    title: String(row.title),
    qty: Number(row.qty),
    revenue: Number(row.revenue),
  }));
}

function toDistribution(rows: unknown[], transformLabel?: (label: string) => string) {
  return (rows as Record<string, unknown>[]).map((row) => {
    const label = String(row.label ?? row.status);

    return {
      label: transformLabel ? transformLabel(label) : label,
      count: Number(row.count),
    };
  });
}

export async function getAnalyticsSummary(range?: DateRange): Promise<AnalyticsSummary> {
  const { fromMs, toMs } = resolveAnalyticsWindow(range);

  const [summaryResult, itemsSoldResult] = await Promise.all([
    databaseAdapter.run(sql`
      SELECT
        COUNT(*) as totalOrders,
        COALESCE(ROUND(SUM(total), 2), 0) as totalRevenue,
        COALESCE(ROUND(AVG(total), 2), 0) as avgOrderValue,
        COALESCE(ROUND(SUM(CASE WHEN status = 'approved' THEN total ELSE 0 END), 2), 0) as approvedRevenue,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approvedOrders,
        COALESCE(SUM(CASE WHEN status IN ('pending_payment', 'under_review') THEN 1 ELSE 0 END), 0) as pendingOrders,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejectedOrders
      FROM ${Order}
      WHERE createdAt >= ${fromMs} AND createdAt < ${toMs}
    `),
    databaseAdapter.run(sql`
      SELECT COALESCE(SUM(oi.quantity), 0) as totalItemsSold
      FROM ${OrderItem} oi
      INNER JOIN ${Order} o ON o.id = oi.orderId
      WHERE o.createdAt >= ${fromMs} AND o.createdAt < ${toMs}
    `),
  ]);

  const sr = (summaryResult.rows[0] ?? {}) as Record<string, unknown>;
  const ir = (itemsSoldResult.rows[0] ?? {}) as Record<string, unknown>;

  return {
    totalOrders: Number(sr.totalOrders ?? 0),
    totalRevenue: Number(sr.totalRevenue ?? 0),
    approvedRevenue: Number(sr.approvedRevenue ?? 0),
    avgOrderValue: Number(sr.avgOrderValue ?? 0),
    totalItemsSold: Number(ir.totalItemsSold ?? 0),
    approvedOrders: Number(sr.approvedOrders ?? 0),
    pendingOrders: Number(sr.pendingOrders ?? 0),
    rejectedOrders: Number(sr.rejectedOrders ?? 0),
  };
}

export async function getAnalyticsDatasets(range?: DateRange, adapter: DatabaseSession = databaseAdapter): Promise<AnalyticsDatasets> {
  const { fromMs, toMs, last30BusinessDayWindow } = resolveAnalyticsWindow(range);

  const [
    topByQtyResult,
    topByRevenueResult,
    topByEstimatedProfitResult,
    neverOrderedResult,
    byDayOfWeekResult,
    byHourResult,
    byDayResult,
    byStatusResult,
    byPaymentMethodResult,
  ] = await Promise.all([
    adapter.run(sql`
      SELECT
        oi.productId,
        oi.title,
        SUM(oi.quantity) as qty,
        ROUND(SUM(oi.lineTotal), 2) as revenue
      FROM ${OrderItem} oi
      INNER JOIN ${Order} o ON o.id = oi.orderId
      WHERE o.createdAt >= ${fromMs} AND o.createdAt < ${toMs}
      GROUP BY oi.productId, oi.title
      ORDER BY qty DESC
      LIMIT 10
    `),
    adapter.run(sql`
      SELECT
        oi.productId,
        oi.title,
        ROUND(SUM(oi.lineTotal), 2) as revenue,
        SUM(oi.quantity) as qty
      FROM ${OrderItem} oi
      INNER JOIN ${Order} o ON o.id = oi.orderId
      WHERE o.createdAt >= ${fromMs} AND o.createdAt < ${toMs}
      GROUP BY oi.productId, oi.title
      ORDER BY revenue DESC
      LIMIT 10
    `),
    adapter.run(sql`
      SELECT
        oi.productId,
        oi.title,
        ROUND(SUM(oi.lineTotal), 2) as approvedRevenue,
        SUM(oi.quantity) as approvedQty,
        p.recipe as recipeRaw
      FROM ${OrderItem} oi
      INNER JOIN ${Order} o ON o.id = oi.orderId
      LEFT JOIN ${Product} p ON p.id = oi.productId
      WHERE o.status = 'approved' AND o.createdAt >= ${fromMs} AND o.createdAt < ${toMs}
      GROUP BY oi.productId, oi.title, p.recipe
    `),
    adapter.run(sql`
      SELECT p.id, p.slug, p.title, p.price
      FROM ${Product} p
      LEFT JOIN ${OrderItem} oi ON oi.productId = p.id
      WHERE oi.id IS NULL
      ORDER BY p.title
    `),
    adapter.run(sql`
      SELECT
        ${BUSINESS_DAY_OF_WEEK_SQL} as day,
        COUNT(*) as count,
        ROUND(COALESCE(SUM(total), 0), 2) as revenue
      FROM ${Order}
      WHERE createdAt >= ${fromMs} AND createdAt < ${toMs}
      GROUP BY day
      ORDER BY day
    `),
    adapter.run(sql`
      SELECT
        ${BUSINESS_HOUR_SQL} as hour,
        COUNT(*) as count
      FROM ${Order}
      WHERE createdAt >= ${fromMs} AND createdAt < ${toMs}
      GROUP BY hour
      ORDER BY hour
    `),
    range
      ? adapter.run(sql`
          SELECT
            ${BUSINESS_DATE_SQL} as orderDate,
            COUNT(*) as orders,
            ROUND(COALESCE(SUM(total), 0), 2) as revenue
          FROM ${Order}
          WHERE createdAt >= ${fromMs} AND createdAt < ${toMs}
          GROUP BY orderDate
          ORDER BY orderDate
        `)
      : adapter.run(sql`
          SELECT
            ${BUSINESS_DATE_SQL} as orderDate,
            COUNT(*) as orders,
            ROUND(COALESCE(SUM(total), 0), 2) as revenue
          FROM ${Order}
          WHERE ${BUSINESS_DATE_SQL} >= date(${last30BusinessDayWindow.anchorDate}, '-29 days')
          GROUP BY orderDate
          ORDER BY orderDate
        `),
    adapter.run(sql`
      SELECT status, COUNT(*) as count
      FROM ${Order}
      WHERE createdAt >= ${fromMs} AND createdAt < ${toMs}
      GROUP BY status
      ORDER BY count DESC
    `),
    adapter.run(sql`
      SELECT pay.method as label, COUNT(*) as count
      FROM ${Payment} pay
      INNER JOIN ${Order} o ON o.id = pay.orderId
      WHERE o.createdAt >= ${fromMs} AND o.createdAt < ${toMs}
      GROUP BY pay.method
      ORDER BY count DESC
    `),
  ]);

  const profitabilityRanking = buildEstimatedProfitabilityRanking(
    (topByEstimatedProfitResult.rows as Record<string, unknown>[]).map((row) => ({
      productId: String(row.productId),
      title: String(row.title),
      approvedQty: Number(row.approvedQty),
      approvedRevenue: Number(row.approvedRevenue),
      recipeRaw: typeof row.recipeRaw === 'string' ? row.recipeRaw : null,
    })),
  );

  const rawDow = new Map<number, { count: number; revenue: number }>();
  (byDayOfWeekResult.rows as Record<string, unknown>[]).forEach((row) => {
    rawDow.set(Number(row.day), { count: Number(row.count), revenue: Number(row.revenue) });
  });

  const rawHour = new Map<number, number>();
  (byHourResult.rows as Record<string, unknown>[]).forEach((row) => {
    rawHour.set(Number(row.hour), Number(row.count));
  });

  const rawByDate = new Map<string, { orders: number; revenue: number }>();
  (byDayResult.rows as Record<string, unknown>[]).forEach((row) => {
    rawByDate.set(String(row.orderDate), { orders: Number(row.orders), revenue: Number(row.revenue) });
  });

  const byDayDates = range
    ? generateRangeDates(range.from, range.to)
    : last30BusinessDayWindow.dates;

  return {
    topByQty: toProductRanking(topByQtyResult.rows),
    topByRevenue: toProductRanking(topByRevenueResult.rows),
    topByEstimatedProfit: profitabilityRanking.items,
    profitabilityCoverage: {
      rankedProducts: profitabilityRanking.items.length,
      productsWithoutEstimatedCost: profitabilityRanking.productsWithoutEstimatedCost,
    },
    neverOrdered: (neverOrderedResult.rows as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      price: Number(row.price),
    })),
    byDayOfWeek: Array.from({ length: 7 }, (_, day) => ({
      day,
      dayName: DAY_NAMES[day],
      count: rawDow.get(day)?.count ?? 0,
      revenue: rawDow.get(day)?.revenue ?? 0,
    })),
    byHour: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: rawHour.get(hour) ?? 0,
    })),
    byDay: byDayDates.map((date) => ({
      date,
      orders: rawByDate.get(date)?.orders ?? 0,
      revenue: rawByDate.get(date)?.revenue ?? 0,
    })),
    byStatus: toDistribution(byStatusResult.rows),
    byPaymentMethod: toDistribution(byPaymentMethodResult.rows, formatPaymentMethod),
  };
}

export async function getAnalyticsData(range?: DateRange) {
  const [summary, datasets] = await Promise.all([
    getAnalyticsSummary(range),
    getAnalyticsDatasets(range),
  ]);

  return {
    summary,
    ...datasets,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
