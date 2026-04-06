
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

  // Close cart on route change and page refresh
  useEffect(() => {
    const closeCart = () => setIsOpen(false);
    
    // Close on initial page load (component mounts)
    closeCart();
    
    // Listen for Astro's navigation events
    document.addEventListener('astro:page-load', closeCart);
    
    return () => {
      document.removeEventListener('astro:page-load', closeCart);
    };
  }, []);

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

  const formatPrice = (price: number) =>
    `$${price.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tax = $totalPriceValue * 0.15;
  const grandTotal = $totalPriceValue + tax;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={toggleCart}
        aria-expanded={isOpen}
        class="active:translate-y-1 transition-all text-sm md:text-xl relative"
      >
        <Cart />
        {$cartItems.length > 0 && (
          <span
            aria-hidden="true"
            class="bg-guacamole-pulpa text-guacamole-icons rounded-full absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs font-black leading-none"
          >
            {$totalQty}
          </span>
        )}
      </button>

      {/* Mini-Cart Panel */}
      {isOpen && (
        <div
          ref={cartRef}
          role="dialog"
          aria-label="Tu carrito de compras"
          aria-modal="true"
          class="absolute top-full right-0 mt-3 w-96 max-h-[80vh] bg-white border border-guacamole-b/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] z-50 flex flex-col overflow-hidden"
          style="max-width: calc(100vw - 1rem);"
        >
          {/* Header - dark, mirrors navbar */}
          <div class="flex items-center justify-between px-5 py-3.5 bg-[#1d1d1f] border-b-2 border-guacamole-b/40">
            <div class="flex items-center gap-2.5 text-white">
              <span class="text-guacamole-f opacity-90"><Cart /></span>
              <h2 class="font-black text-base uppercase tracking-wide leading-none">Tu carrito</h2>
              {$cartItems.length > 0 && (
                <span class="bg-guacamole-b/20 text-guacamole-f text-xs font-bold px-2 py-0.5 rounded-full border border-guacamole-b/30">
                  {$totalQty} {$totalQty === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              onClick={toggleCart}
              aria-label="Cerrar carrito"
              class="text-white/60 hover:text-white hover:bg-white/10 rounded-lg w-8 h-8 flex items-center justify-center transition-colors text-xl font-light"
            >
              ×
            </button>
          </div>

          {/* Items - Scrollable */}
          <div class="flex-1 overflow-y-auto">
            {$cartItems.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
                <div class="w-16 h-16 bg-guacamole-fondo/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-guacamole-b/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p class="text-guacamole-icons font-bold text-base">Tu carrito está vacío</p>
                  <p class="text-sm text-gray-400 mt-1">¡Agrega algunos productos y empezá!</p>
                </div>
                <a href="/tienda" class="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-guacamole-b hover:text-guacamole-a transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Ir a la tienda
                </a>
              </div>
            ) : (
              <div class="divide-y divide-gray-100">
                {$cartItems.map((product: CartItem) => (
                  <div class="flex gap-3 p-4 hover:bg-gray-50/80 transition-colors group">
                    {/* Image */}
                    <div class="shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        class="w-16 h-16 object-cover rounded-xl border-2 border-guacamole-f/40 shadow-sm"
                      />
                    </div>

                    {/* Info */}
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-sm text-guacamole-icons leading-snug line-clamp-1">
                        {product.name}
                      </p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs bg-guacamole-fondo/15 text-guacamole-icons font-semibold px-1.5 py-0.5 rounded">
                          {product.size}
                        </span>
                        <span class="text-xs text-gray-400">
                          Cant: <strong class="text-gray-600">{product.quantity}</strong>
                        </span>
                      </div>
                      <div class="flex items-baseline gap-1.5 mt-1.5">
                        <span class="text-sm font-black text-guacamole-pulpa">
                          {formatPrice((product.price ?? 0) * product.quantity)}
                        </span>
                        {product.quantity > 1 && (
                          <span class="text-xs text-gray-400">
                            ({formatPrice(product.price ?? 0)} c/u)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove — visible on hover */}
                    <button
                      onClick={() => handleRemoveItem(product.productId, product.size)}
                      aria-label={'Eliminar ' + product.name + ' del carrito'}
                      class="shrink-0 self-start mt-0.5 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Totals & CTA */}
          {$cartItems.length > 0 && (
            <div class="border-t border-gray-100">
              {/* Price Breakdown */}
              <div class="px-5 pt-4 pb-2 space-y-2">
                <div class="flex justify-between items-center text-sm text-gray-500">
                  <span class="font-medium">Subtotal</span>
                  <span class="font-semibold text-guacamole-icons">{formatPrice($totalPriceValue)}</span>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-500">
                  <span class="font-medium">Impuesto (15%)</span>
                  <span class="font-semibold text-guacamole-icons">{formatPrice(tax)}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t-2 border-guacamole-f/30">
                  <span class="text-base font-black text-guacamole-icons uppercase tracking-wide">Total</span>
                  <span class="text-xl font-black text-guacamole-pulpa">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div class="mx-5 mb-3 bg-guacamole-fondo/10 rounded-xl p-3 space-y-1.5">
                <div class="flex items-center gap-2 text-xs text-guacamole-icons">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-guacamole-b shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span class="font-semibold">Envío gratis en pedidos mayores a $50</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-guacamole-icons">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-guacamole-b shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-semibold">Garantía de devolución de 30 días</span>
                </div>
              </div>

              {/* CTA Primary */}
              <div class="px-5 pb-3 space-y-2">
                <a
                  href="/checkout"
                  class="flex items-center justify-center gap-2 w-full bg-guacamole-pulpa text-guacamole-icons font-black text-sm py-3 px-6 tracking-wider uppercase rounded-full shadow-[0_4px_12px_rgba(86,130,3,0.3)] hover:bg-guacamole-f hover:shadow-[0_6px_20px_rgba(86,130,3,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Ir a pagar
                </a>
                <div class="flex items-center justify-between">
                  <a href="/tienda" class="text-xs text-guacamole-b hover:text-guacamole-a font-semibold transition-colors">← Seguir comprando</a>
                  <button onClick={handleClearCart} class="text-xs text-gray-400 hover:text-red-500 transition-colors">Vaciar carrito</button>
                </div>
              </div>

              {/* Secure Badge */}
              <div class="px-5 pb-4">
                <p class="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Compra 100% segura
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
