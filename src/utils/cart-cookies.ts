import type { CartItem } from '@interfaces/cart-item';
import Cookies from 'js-cookie';

export class CartCookiesClient {
  static getCart(): CartItem[] {
    return JSON.parse(Cookies.get('cart') ?? '[]');
  }

  static clearCart() {
    Cookies.remove('cart');
  }

  static addItem(cartItem: CartItem): CartItem[] {
    const cart = CartCookiesClient.getCart();

    const itemInCart = cart.find(
      (item) =>
        item.productId === cartItem.productId && item.size === cartItem.size
    );

    if (itemInCart) {
      itemInCart.quantity += cartItem.quantity;
    } else {
      cart.push(cartItem);
    }

    Cookies.set('cart', JSON.stringify(cart));

    return cart;
  }

  static removeItem(productId: string, size: string): CartItem[] {
    const cart = CartCookiesClient.getCart();

    const updatedCart = cart.filter(
      (item) => !(item.productId === productId && item.size === size)
    );

    Cookies.set('cart', JSON.stringify(updatedCart));

    return updatedCart;
  }

  static updateQuantity(productId: string, size: string, delta: number): CartItem[] {
    const cart = CartCookiesClient.getCart();
    const item = cart.find((i) => i.productId === productId && i.size === size);

    if (!item) return cart;

    item.quantity = Math.max(0, item.quantity + delta);

    const updatedCart = item.quantity === 0
      ? cart.filter((i) => !(i.productId === productId && i.size === size))
      : cart;

    Cookies.set('cart', JSON.stringify(updatedCart));

    return updatedCart;
  }
}
