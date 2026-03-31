import { atom, computed } from 'nanostores';
import type { CartItem } from '@interfaces/cart-item';

// Store the full cart array
export const cartItems = atom<CartItem[]>([]);

// Computed: total quantity (sum of all item quantities)
export const totalQuantity = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

// Computed: total price
export const totalPrice = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
);

// DEPRECATED: Use cartItems and totalQuantity instead
// Kept for backwards compatibility during migration
export const itemsIncart = totalQuantity;
