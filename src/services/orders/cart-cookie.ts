import type { CartItem } from '@interfaces/cart-item';

export function parseCartCookie(raw: string | undefined): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
