export const ORDER_STATUS = {
  pendingPayment: 'pending_payment',
  underReview: 'under_review',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  pending: 'pending',
  proofUploaded: 'proof_uploaded',
  underReview: 'under_review',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export const PAYMENT_METHODS = {
  bancolombia: 'bancolombia',
  nequi: 'nequi',
  qr: 'qr',
} as const;

/** Métodos disponibles para nuevos pagos (excluye deprecados) */
export const ACTIVE_PAYMENT_METHODS = ['bancolombia', 'nequi', 'qr'] as const;
export type ActivePaymentMethod = typeof ACTIVE_PAYMENT_METHODS[number];

export const NOTIFICATION_CHANNEL = {
  email: 'email',
  whatsapp: 'whatsapp',
} as const;

export const NOTIFICATION_STATUS = {
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
} as const;

export const PAYMENT_PROOF_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const PAYMENT_PROOF_MAX_BYTES = 8 * 1024 * 1024;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export function orderRequiresClientAction(status: string) {
  return status === ORDER_STATUS.pendingPayment || status === ORDER_STATUS.rejected;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatOrderStatus(status: string) {
  switch (status) {
    case ORDER_STATUS.pendingPayment:
      return 'Pendiente de pago';
    case ORDER_STATUS.underReview:
      return 'En revisión';
    case ORDER_STATUS.approved:
      return 'Aprobado';
    case ORDER_STATUS.rejected:
      return 'Rechazado';
    case ORDER_STATUS.cancelled:
      return 'Cancelado';
    default:
      return status;
  }
}

export function formatPaymentStatus(status: string) {
  switch (status) {
    case PAYMENT_STATUS.pending:
      return 'Pendiente';
    case PAYMENT_STATUS.proofUploaded:
      return 'Comprobante cargado';
    case PAYMENT_STATUS.underReview:
      return 'En revisión';
    case PAYMENT_STATUS.approved:
      return 'Aprobado';
    case PAYMENT_STATUS.rejected:
      return 'Rechazado';
    default:
      return status;
  }
}

export function formatPaymentMethod(method: string) {
  switch (method) {
    case PAYMENT_METHODS.bancolombia:
      return 'Bancolombia';
    case PAYMENT_METHODS.nequi:
      return 'Nequi';
    case PAYMENT_METHODS.qr:
      return 'QR';
    default:
      return method;
  }
}
