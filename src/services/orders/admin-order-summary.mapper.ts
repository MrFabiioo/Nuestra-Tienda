import { normalizeDbDate } from '@utils/db-date';

export type AdminOrderSummary = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: Date | null;
  paymentStatus: string;
  paymentMethod: string;
  proofUploadedAt: Date | null;
};

type AdminOrderSummaryRow = Record<string, unknown>;

function warnInvalidAdminOrderDate(field: 'createdAt', row: AdminOrderSummaryRow) {
  console.warn('[orders/admin] Invalid date in admin order summary row', {
    orderId: String(row.id ?? 'unknown'),
    field,
    value: row[field],
  });
}

export function mapAdminOrderSummary(row: AdminOrderSummaryRow): AdminOrderSummary {
  const createdAt = normalizeDbDate(row.createdAt);

  if (!createdAt) {
    warnInvalidAdminOrderDate('createdAt', row);
  }

  return {
    id: String(row.id),
    customerName: String(row.customerName),
    customerEmail: String(row.customerEmail),
    customerPhone: String(row.customerPhone),
    total: Number(row.total),
    status: String(row.status),
    createdAt,
    paymentStatus: String(row.paymentStatus),
    paymentMethod: String(row.paymentMethod),
    proofUploadedAt: normalizeDbDate(row.proofUploadedAt),
  };
}
