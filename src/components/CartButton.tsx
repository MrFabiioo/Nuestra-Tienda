
import { useState, useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import Cookies from 'js-cookie';
import Cart from './svgs/Cart';
import { cartItems, totalQuantity, totalPrice } from 'src/store/cart.store';
import { CartCookiesClient } from '@utils/cart-cookies';
import type { CartItem } from '@interfaces/cart-item';

export default function CartButton() {
  const $cartItems = useStore(cartItems);
  const $totalQty = useStore(totalQuantity);
  const $totalPriceValue = useStore(totalPrice);
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  // Sync cart from cookies on mount
  useEffect(() => {
    const initialCart = CartCookiesClient.getCart();
    cartItems.set(initialCart);
  }, []);

  // Close cart when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveItem = (productId: string, size: string) => {
    const updatedCart = CartCookiesClient.removeItem(productId, size);
    cartItems.set(updatedCart);
  };

  const handleClearCart = () => {
    cartItems.set([]);
    Cookies.remove('cart');
  };

  // Helper to format currency
  const formatPrice = (price: number) => `$${price.toLocaleString()}`;

  return (
    <>
      <button
        onClick={toggleCart}
        class="active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl relative"
      >
        <Cart />
        {$cartItems.length > 0 && (
          <p class="bg-guacamole-pulpa text-guacamole-icons rounded-full absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs font-bold">
            {$totalQty}
          </p>
        )}
      </button>

      {isOpen && (
        <div
          ref={cartRef}
          class="absolute top-full right-2 mt-2 w-80 max-h-[70vh] bg-white border-2 border-guacamole-b rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div class="flex items-center justify-between p-4 bg-guacamole-a text-white">
            <div class="flex items-center gap-2">
              <Cart />
              <h2 class="font-extrabold text-lg uppercase">Tu carrito</h2>
            </div>
            <button
              onClick={toggleCart}
              class="text-white hover:text-guacamole-f text-2xl font-bold transition-colors"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Cart Items - Scrollable */}
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {$cartItems.length === 0 ? (
              <div class="text-center py-8 text-gray-500">
                <p class="text-lg">Tu carrito está vacío</p>
                <p class="text-sm mt-2">¡Agrega algunos productos!</p>
              </div>
            ) : (
              $cartItems.map((product: CartItem) => (
                <div class="flex gap-3 p-2 bg-guacamole-fondo/20 rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    class="w-16 h-16 object-cover rounded-lg"
                  />

                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p class="text-xs text-gray-500">
                      Talla: <span class="font-bold">{product.size}</span>
                    </p>
                    <p class="text-xs text-gray-500">
                      Cantidad: {product.quantity}
                    </p>
                    <p class="text-sm font-bold text-guacamole-pulpa">
                      {formatPrice((product.price ?? 0) * product.quantity)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(product.productId, product.size)}
                    class="self-start text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Eliminar producto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer with totals and actions */}
          {$cartItems.length > 0 && (
            <>
              {/* Cart Total */}
              <div class="border-t border-gray-200 p-4 bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm text-gray-600 uppercase">Total</span>
                  <span class="text-xl font-bold text-guacamole-pulpa">
                    {formatPrice($totalPriceValue)}
                  </span>
                </div>

                {/* Clear Cart Button */}
                <button
                  onClick={handleClearCart}
                  class="text-xs text-red-500 hover:text-red-700 underline mb-3 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Guarantees */}
              <div class="px-4 py-2 bg-guacamole-fondo/30 border-t border-gray-100">
                <p class="text-xs text-guacamole-icons uppercase">
                  ✔ Envío gratis en pedidos mayores a $50
                </p>
                <p class="text-xs text-guacamole-icons uppercase">
                  ✔ Garantía de devolución de 30 días
                </p>
              </div>

              {/* Checkout Button */}
              <a
                class="group relative focus:ring-3 focus:outline-hidden"
                href="/checkout"
              >
                <span class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-guacamole-f transition-transform group-hover:translate-x-0 group-hover:translate-y-0"></span>
                <span class="relative w-full inline-block border-2 border-current px-8 py-3 text-sm font-bold tracking-widest text-black uppercase text-center">
                  Ir a pagar
                </span>
              </a>
            </>
          )}
        </div>
      )}
    </>
  );
}
