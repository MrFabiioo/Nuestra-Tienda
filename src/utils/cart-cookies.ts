import Cookies from "js-cookie";
import type { CartItem } from "src/interfaces/cart-item";

export class CartCookiesClient {
    static getCart() {
        return JSON.parse(Cookies.get('cart') ?? '[]');
    }

    static addItem(cartItem: CartItem): CartItem[] {
        //const cart = CartCookiesClient.getCart();
        interface CartItemInCart extends CartItem {
            quantity: number;
        }
        const cart: CartItemInCart[] = CartCookiesClient.getCart();
        const itemInCart: CartItemInCart | undefined = cart.find(
            (item: CartItemInCart) => item.productId === cartItem.productId && item.size === cartItem.size
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
        interface CartItemInCart extends CartItem {
            quantity: number;
        }
        const updateCart: CartItemInCart[] = cart.filter(
            (item: CartItemInCart) => !(item.productId === productId && item.size === size)
        );
        Cookies.set('cart', JSON.stringify(cart));

        return updateCart;

    }
}