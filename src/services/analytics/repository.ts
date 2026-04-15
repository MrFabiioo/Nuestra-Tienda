import { db, Order, OrderItem, Payment, Product, sql } from 'astro:db';
import { getLast30BusinessDayWindow } from './business-timezone';
import {
  buildBusinessDateExpression,
  buildBusinessDayOfWeekExpression,
  buildBusinessHourExpression,
} from './sqlite-business-time';
import { buildEstimatedProfitabilityRanking } from './estimated-profitability';
import { formatPaymentMethod } from '../orders/constants';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BUSINESS_DAY_OF_WEEK_SQL = sql.raw(buildBusinessDayOfWeekExpression('createdAt'));
const BUSINESS_HOUR_SQL = sql.raw(buildBusinessHourExpression('createdAt'));
const BUSINESS_DATE_SQL = sql.raw(buildBusinessDateExpression('createdAt'));

export async function getAnalyticsData() {
  const analyticsReferenceDate = new Date();
  const last30BusinessDayWindow = getLast30BusinessDayWindow(analyticsReferenceDate);

  const [
    summaryResult,
    itemsSoldResult,
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

    // KPI summary
    db.run(sql`
      SELECT
        COUNT(*) as totalOrders,
        COALESCE(ROUND(SUM(total), 2), 0) as totalRevenue,
        COALESCE(ROUND(AVG(total), 2), 0) as avgOrderValue,
        COALESCE(ROUND(SUM(CASE WHEN status = 'approved' THEN total ELSE 0 END), 2), 0) as approvedRevenue,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approvedOrders,
        COALESCE(SUM(CASE WHEN status IN ('pending_payment', 'under_review') THEN 1 ELSE 0 END), 0) as pendingOrders,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejectedOrders
      FROM ${Order}
    `),

    // Total units sold
    db.run(sql`
      SELECT COALESCE(SUM(quantity), 0) as totalItemsSold FROM ${OrderItem}
    `),

    // Top 10 products by quantity
    db.run(sql`
      SELECT
        oi.productId,
        oi.title,
        SUM(oi.quantity) as qty,
        ROUND(SUM(oi.lineTotal), 2) as revenue
      FROM ${OrderItem} oi
      GROUP BY oi.productId, oi.title
      ORDER BY qty DESC
      LIMIT 10
    `),

    // Top 10 products by gross historical revenue
    db.run(sql`
      SELECT
        oi.productId,
        oi.title,
        ROUND(SUM(oi.lineTotal), 2) as revenue,
        SUM(oi.quantity) as qty
      FROM ${OrderItem} oi
      GROUP BY oi.productId, oi.title
      ORDER BY revenue DESC
      LIMIT 10
    `),

    // Top approved products by estimated profitability
    db.run(sql`
      SELECT
        oi.productId,
        oi.title,
        ROUND(SUM(oi.lineTotal), 2) as approvedRevenue,
        SUM(oi.quantity) as approvedQty,
        p.recipe as recipeRaw
      FROM ${OrderItem} oi
      INNER JOIN ${Order} o ON o.id = oi.orderId
      LEFT JOIN ${Product} p ON p.id = oi.productId
      WHERE o.status = 'approved'
      GROUP BY oi.productId, oi.title, p.recipe
    `),

    // Products with zero orders
    db.run(sql`
      SELECT p.id, p.title, p.price
      FROM ${Product} p
      LEFT JOIN ${OrderItem} oi ON oi.productId = p.id
      WHERE oi.id IS NULL
      ORDER BY p.title
    `),

    // Orders grouped by day of week (0=Sunday … 6=Saturday)
    db.run(sql`
      SELECT
        ${BUSINESS_DAY_OF_WEEK_SQL} as day,
        COUNT(*) as count,
        ROUND(COALESCE(SUM(total), 0), 2) as revenue
      FROM ${Order}
      GROUP BY day
      ORDER BY day
    `),

    // Orders grouped by business hour
    db.run(sql`
      SELECT
        ${BUSINESS_HOUR_SQL} as hour,
        COUNT(*) as count
      FROM ${Order}
      GROUP BY hour
      ORDER BY hour
    `),

    // Daily trend — last 30 days (all statuses)
    db.run(sql`
      SELECT
        ${BUSINESS_DATE_SQL} as orderDate,
        COUNT(*) as orders,
        ROUND(COALESCE(SUM(total), 0), 2) as revenue
      FROM ${Order}
      WHERE ${BUSINESS_DATE_SQL} >= date(${last30BusinessDayWindow.anchorDate}, '-29 days')
      GROUP BY orderDate
      ORDER BY orderDate
    `),

    // Order status distribution
    db.run(sql`
      SELECT status, COUNT(*) as count
      FROM ${Order}
      GROUP BY status
      ORDER BY count DESC
    `),

    // Payment method distribution
    db.run(sql`
      SELECT method as label, COUNT(*) as count
      FROM ${Payment}
      GROUP BY method
      ORDER BY count DESC
    `),
  ]);

  // ── Summary ────────────────────────────────────────────────────────
  const sr = (summaryResult.rows[0] ?? {}) as Record<string, unknown>;
  const ir = (itemsSoldResult.rows[0] ?? {}) as Record<string, unknown>;

  const summary = {
    totalOrders:     Number(sr.totalOrders   ?? 0),
    totalRevenue:    Number(sr.totalRevenue  ?? 0),
    approvedRevenue: Number(sr.approvedRevenue ?? 0),
    avgOrderValue:   Number(sr.avgOrderValue ?? 0),
    totalItemsSold:  Number(ir.totalItemsSold ?? 0),
    approvedOrders:  Number(sr.approvedOrders ?? 0),
    pendingOrders:   Number(sr.pendingOrders  ?? 0),
    rejectedOrders:  Number(sr.rejectedOrders ?? 0),
  };

  // ── Top products ───────────────────────────────────────────────────
  const toProduct = (rows: unknown[]) =>
    (rows as Record<string, unknown>[]).map(r => ({
      productId: String(r.productId),
      title:     String(r.title),
      qty:       Number(r.qty),
      revenue:   Number(r.revenue),
    }));

  const topByQty = toProduct(topByQtyResult.rows);
  const topByRevenue = toProduct(topByRevenueResult.rows);
  const profitabilityRanking = buildEstimatedProfitabilityRanking(
    (topByEstimatedProfitResult.rows as Record<string, unknown>[]).map(row => ({
      productId: String(row.productId),
      title: String(row.title),
      approvedQty: Number(row.approvedQty),
      approvedRevenue: Number(row.approvedRevenue),
      recipeRaw: typeof row.recipeRaw === 'string' ? row.recipeRaw : null,
    })),
  );

  // ── Never ordered ──────────────────────────────────────────────────
  const neverOrdered = (neverOrderedResult.rows as Record<string, unknown>[]).map(r => ({
    id:    String(r.id),
    title: String(r.title),
    price: Number(r.price),
  }));

  // ── Day of week — fill all 7 ───────────────────────────────────────
  const rawDow = new Map<number, { count: number; revenue: number }>();
  (byDayOfWeekResult.rows as Record<string, unknown>[]).forEach(r => {
    rawDow.set(Number(r.day), { count: Number(r.count), revenue: Number(r.revenue) });
  });
  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
    day:     i,
    dayName: DAY_NAMES[i],
    count:   rawDow.get(i)?.count   ?? 0,
    revenue: rawDow.get(i)?.revenue ?? 0,
  }));

  // ── Hour of day — fill all 24 ──────────────────────────────────────
  const rawHour = new Map<number, number>();
  (byHourResult.rows as Record<string, unknown>[]).forEach(r => {
    rawHour.set(Number(r.hour), Number(r.count));
  });
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour:  h,
    count: rawHour.get(h) ?? 0,
  }));

  // ── Daily trend — fill 30 days ─────────────────────────────────────
  const rawByDate = new Map<string, { orders: number; revenue: number }>();
  (byDayResult.rows as Record<string, unknown>[]).forEach(r => {
    rawByDate.set(String(r.orderDate), { orders: Number(r.orders), revenue: Number(r.revenue) });
  });
  const byDay = last30BusinessDayWindow.dates.map(date => ({
    date,
    orders:  rawByDate.get(date)?.orders  ?? 0,
    revenue: rawByDate.get(date)?.revenue ?? 0,
  }));

  // ── Distributions ──────────────────────────────────────────────────
  const toDist = (rows: unknown[], transformLabel?: (label: string) => string) =>
    (rows as Record<string, unknown>[]).map(r => {
      const label = String(r.label ?? r.status);

      return {
        label: transformLabel ? transformLabel(label) : label,
        count: Number(r.count),
      };
    });

  const byStatus         = toDist(byStatusResult.rows);
  const byPaymentMethod  = toDist(byPaymentMethodResult.rows, formatPaymentMethod);

  return {
    summary,
    topByQty,
    topByRevenue,
    topByEstimatedProfit: profitabilityRanking.items,
    profitabilityCoverage: {
      rankedProducts: profitabilityRanking.items.length,
      productsWithoutEstimatedCost: profitabilityRanking.productsWithoutEstimatedCost,
    },
    neverOrdered,
    byDayOfWeek,
    byHour,
    byDay,
    byStatus,
    byPaymentMethod,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
