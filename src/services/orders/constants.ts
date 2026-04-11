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
  transferencia: 'transferencia',
} as const;

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
export const ORDER_TAX_RATE = 0.15;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

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
