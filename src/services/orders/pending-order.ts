import type { AstroCookies } from 'astro';
import { ORDER_STATUS } from './constants';
import { getPublicOrderByToken } from './repository';
import type { PublicOrder } from './repository';

export const PENDING_ORDER_COOKIE = 'pendingOrderPointer';

const PENDING_ORDER_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 30,
};

export function readPendingOrderPointer(cookies: AstroCookies) {
  return cookies.get(PENDING_ORDER_COOKIE)?.value ?? null;
}

export function setPendingOrderPointer(cookies: AstroCookies, token: string) {
  cookies.set(PENDING_ORDER_COOKIE, token, PENDING_ORDER_COOKIE_OPTIONS);
}

export function clearPendingOrderPointer(cookies: AstroCookies) {
  cookies.delete(PENDING_ORDER_COOKIE, { path: '/' });
}

export function clearPendingOrderPointerForToken(cookies: AstroCookies, token: string) {
  if (readPendingOrderPointer(cookies) !== token) return;

  clearPendingOrderPointer(cookies);
}

export function orderRequiresClientAction(status: string) {
  return status === ORDER_STATUS.pendingPayment || status === ORDER_STATUS.rejected;
}

export function reconcilePendingOrderPointer(cookies: AstroCookies, order: Pick<PublicOrder, 'status' | 'token'> | null) {
  if (order && orderRequiresClientAction(order.status)) {
    setPendingOrderPointer(cookies, order.token);
    return order.token;
  }

  clearPendingOrderPointer(cookies);
  return null;
}

export async function getPendingOrderFromCookies(cookies: AstroCookies): Promise<PublicOrder | null> {
  const token = readPendingOrderPointer(cookies);
  if (!token) return null;

  const order = await getPublicOrderByToken(token);
  if (!order) {
    clearPendingOrderPointer(cookies);
    return null;
  }

  if (!orderRequiresClientAction(order.status)) {
    clearPendingOrderPointer(cookies);
    return null;
  }

  return order;
}
