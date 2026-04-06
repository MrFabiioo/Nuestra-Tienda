export type CartFeedbackType = 'add' | 'remove' | 'clear';

export interface CartFeedbackDetail {
  type: CartFeedbackType;
  productName?: string;
  quantity?: number;
  size?: string;
  totalItems?: number;
  message?: string;
}

const CART_FEEDBACK_EVENT = 'cart:feedback';
const CART_OPEN_EVENT = 'cart:open';

export function emitCartFeedback(detail: CartFeedbackDetail) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<CartFeedbackDetail>(CART_FEEDBACK_EVENT, { detail }));
}

export function emitCartOpen() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
}

export function getCartFeedbackEventName() {
  return CART_FEEDBACK_EVENT;
}

export function getCartOpenEventName() {
  return CART_OPEN_EVENT;
}
