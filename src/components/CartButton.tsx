
import { useState, useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import Cookies from 'js-cookie';
import Cart from './svgs/Cart';
import { cartItems, totalQuantity, totalPrice } from 'src/store/cart.store';
import { CartCookiesClient } from '@utils/cart-cookies';
import type { CartItem } from '@interfaces/cart-item';
import {
  getCartFeedbackEventName,
  getCartOpenEventName,
  type CartFeedbackDetail,
} from '@utils/cart-feedback';

type InlineFeedback = {
  tone: 'success' | 'neutral';
  title: string;
  message: string;
};

export default function CartButton() {
  const $cartItems = useStore(cartItems);
  const $totalQty = useStore(totalQuantity);
  const $totalPriceValue = useStore(totalPrice);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<InlineFeedback | null>(null);
  const [pendingOrderToken, setPendingOrderToken] = useState<string | null>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

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
    setPendingOrderToken(localStorage.getItem('pendingOrderToken'));
  }, []);

  useEffect(() => {
    const feedbackEventName = getCartFeedbackEventName();
    const openEventName = getCartOpenEventName();

    const clearFeedbackTimer = () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };

    const buildFeedback = (detail: CartFeedbackDetail): InlineFeedback => {
      const totalItemsLabel =
        typeof detail.totalItems === 'number'
          ? `${detail.totalItems} ${detail.totalItems === 1 ? 'producto en total' : 'productos en total'}`
          : 'Tu carrito ya quedó al día';

      switch (detail.type) {
        case 'add':
          return {
            tone: 'success',
            title: detail.productName ? `${detail.productName} ya está en tu carrito` : 'Producto agregado al carrito',
            message:
              detail.message ??
              `Sumaste ${detail.quantity ?? 1} ${detail.quantity === 1 ? 'unidad' : 'unidades'}. Ahora tenés ${totalItemsLabel}.`,
          };
        case 'remove':
          return {
            tone: 'neutral',
            title: detail.productName ? `${detail.productName} salió del carrito` : 'Producto quitado del carrito',
            message: detail.message ?? `Listo, actualizamos tu selección. Ahora tenés ${totalItemsLabel}.`,
          };
        case 'clear':
          return {
            tone: 'neutral',
            title: 'Carrito reiniciado',
            message: detail.message ?? 'Dejamos el carrito limpio para que vuelvas a armar tu pedido cuando quieras.',
          };
      }
    };

    const handleFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<CartFeedbackDetail>;
      setIsOpen(true);
      setFeedback(buildFeedback(customEvent.detail));
    };

    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener(feedbackEventName, handleFeedback as EventListener);
    window.addEventListener(openEventName, handleOpen);

    return () => {
      clearFeedbackTimer();
      window.removeEventListener(feedbackEventName, handleFeedback as EventListener);
      window.removeEventListener(openEventName, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!feedback) {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      return;
    }

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 3200);

    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [feedback]);

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
    const itemToRemove = $cartItems.find(
      (item) => item.productId === productId && item.size === size
    );
    const updatedCart = CartCookiesClient.removeItem(productId, size);
    cartItems.set(updatedCart);
    setFeedback({
      tone: 'neutral',
      title: itemToRemove?.name ? `${itemToRemove.name} salió del carrito` : 'Producto quitado del carrito',
      message: `Ahora tenés ${updatedCart.length} ${updatedCart.length === 1 ? 'producto distinto' : 'productos distintos'} en tu mini carrito.`,
    });
  };

  const handleClearCart = () => {
    cartItems.set([]);
    Cookies.remove('cart');
    setFeedback({
      tone: 'neutral',
      title: 'Carrito reiniciado',
      message: 'Tu selección se limpió por completo. Podés volver a cargarla en segundos.',
    });
  };

  const handleDismissPendingOrder = () => {
    localStorage.removeItem('pendingOrderToken');
    setPendingOrderToken(null);
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
        class="relative flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-sm transition-all active:translate-y-1 md:text-xl sm:h-11 sm:w-11"
      >
        <Cart />
        {$cartItems.length > 0 && (
          <span
            aria-hidden="true"
              class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-guacamole-b px-1 text-xs font-black leading-none text-white sm:-right-2 sm:-top-2"
          >
            {$totalQty}
          </span>
        )}
      </button>

      {/* Mini-Cart Panel */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar carrito"
            class="theme-overlay fixed inset-0 z-40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={cartRef}
            role="dialog"
            aria-label="Tu carrito de compras"
            aria-modal="true"
            class="theme-cart-panel fixed inset-x-2 top-16 z-50 mt-2 flex max-h-[calc(100dvh-5rem)] w-auto flex-col overflow-hidden rounded-[1.25rem] sm:inset-x-auto sm:right-3 sm:top-16 sm:mt-0 sm:max-h-[min(80vh,calc(100dvh-5.5rem))] sm:w-[min(24rem,calc(100vw-1.5rem))] sm:rounded-2xl lg:absolute lg:right-0 lg:top-full lg:mt-3 lg:max-h-[80vh] lg:w-96"
          >
          {/* Header - dark, mirrors navbar */}
          <div class="theme-cart-header shrink-0 flex items-start justify-between gap-3 px-3.5 py-3 sm:items-center sm:px-5 sm:py-3.5">
            <div class="flex min-w-0 items-center gap-2 theme-text-primary sm:gap-2.5">
              <span class="opacity-90" style={{ color: 'var(--color-accent)' }}><Cart /></span>
              <div class="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2.5">
                <h2 class="truncate text-sm font-black uppercase leading-none tracking-wide sm:text-base">Tu carrito</h2>
                {$cartItems.length > 0 && (
                  <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:text-xs" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-soft)', color: 'var(--color-accent)' }}>
                    {$totalQty} {$totalQty === 1 ? 'producto' : 'productos'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggleCart}
              aria-label="Cerrar carrito"
              class="theme-text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl font-light transition-colors hover:text-guacamole-b"
              style={{ backgroundColor: 'transparent' }}
            >
              ×
            </button>
          </div>

          {/* Pending order banner */}
          {pendingOrderToken && (
            <div class="shrink-0 border-b px-3.5 py-3 sm:px-5" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))' }}>
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-black uppercase tracking-[0.15em]" style={{ color: 'var(--color-accent)' }}>Pedido pendiente de pago</p>
                  <p class="theme-text-muted mt-0.5 text-xs leading-snug">Todavía tenés un pedido esperando el comprobante.</p>
                  <a
                    href={`/pagos/${pendingOrderToken}`}
                    class="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-guacamole-b hover:text-guacamole-a hover:underline"
                  >
                    Ver mi pedido →
                  </a>
                </div>
                <button
                  onClick={handleDismissPendingOrder}
                  aria-label="Descartar aviso de pedido pendiente"
                  class="theme-text-subtle flex h-6 w-6 shrink-0 items-center justify-center rounded text-base leading-none hover:text-guacamole-b"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Items - Scrollable */}
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {feedback && (
              <div class="theme-soft-surface border-b px-3.5 py-3 sm:px-5" aria-live="polite">
                <div class={`rounded-2xl border px-3 py-2.5 theme-text-primary ${feedback.tone === 'success' ? '' : ''}`} style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface) 95%, transparent)' }}>
                  <p class="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent)' }}>Último cambio</p>
                  <p class="mt-1 text-sm font-bold leading-snug">{feedback.title}</p>
                  <p class="theme-text-muted mt-1 text-xs leading-relaxed">{feedback.message}</p>
                </div>
              </div>
            )}

            {$cartItems.length === 0 ? (
              <div class="flex flex-col items-center justify-center gap-3.5 px-4 py-10 text-center sm:gap-4 sm:px-6 sm:py-12">
                <div class="theme-soft-surface flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-guacamole-b/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p class="theme-text-primary font-bold text-base">Tu carrito está esperando tu pedido</p>
                  <p class="theme-text-subtle mt-1 text-sm">Sumá productos desde la tienda y armalo a tu ritmo.</p>
                </div>
                <a href="/tienda" class="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-guacamole-b transition-colors hover:text-guacamole-a">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Ir a la tienda
                </a>
              </div>
            ) : (
              <div class="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {$cartItems.map((product: CartItem) => (
                  <div class="group flex gap-2.5 p-3 transition-colors sm:gap-3 sm:p-4" style={{ borderColor: 'var(--color-border)' }}>
                    {/* Image */}
                    <div class="shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        class="h-14 w-14 rounded-lg border-2 border-guacamole-b/20 object-cover shadow-sm sm:h-16 sm:w-16 sm:rounded-xl"
                      />
                    </div>

                    {/* Info */}
                    <div class="flex-1 min-w-0">
                      <p class="theme-text-primary line-clamp-2 break-words pr-1 text-sm font-bold leading-snug">
                        {product.name}
                      </p>
                      <div class="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span class="theme-soft-surface theme-text-muted rounded px-1.5 py-0.5 text-xs font-semibold">
                          {product.size}
                        </span>
                        <span class="theme-text-subtle text-xs">
                          Cant: <strong class="theme-text-muted">{product.quantity}</strong>
                        </span>
                      </div>
                      <div class="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span class="text-sm font-black text-guacamole-a">
                          {formatPrice((product.price ?? 0) * product.quantity)}
                        </span>
                        {product.quantity > 1 && (
                          <span class="theme-text-subtle text-xs">
                            ({formatPrice(product.price ?? 0)} c/u)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove — visible on hover */}
                    <button
                      onClick={() => handleRemoveItem(product.productId, product.size)}
                      aria-label={'Eliminar ' + product.name + ' del carrito'}
                      class="theme-text-subtle theme-danger-ghost mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg p-0 transition-all hover:text-red-500 focus:opacity-100 sm:h-auto sm:w-auto sm:p-1.5 sm:opacity-0 sm:group-hover:opacity-100"
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
            <div class="shrink-0 border-t" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface) 96%, transparent)' }}>
              {/* Price Breakdown */}
              <div class="space-y-2 px-3.5 pb-2 pt-3.5 sm:px-5 sm:pt-4">
                <div class="theme-text-muted flex justify-between items-center text-sm">
                  <span class="font-medium">Subtotal</span>
                  <span class="theme-text-primary font-semibold">{formatPrice($totalPriceValue)}</span>
                </div>
                <div class="theme-text-muted flex justify-between items-center text-sm">
                  <span class="font-medium">Impuesto (15%)</span>
                  <span class="theme-text-primary font-semibold">{formatPrice(tax)}</span>
                </div>
                <div class="flex justify-between items-center border-t pt-2" style={{ borderColor: 'var(--color-border-strong)' }}>
                  <span class="theme-text-primary text-base font-black uppercase tracking-wide">Total</span>
                  <span class="text-xl font-black text-guacamole-a">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div class="theme-soft-surface mx-3.5 mb-3 space-y-1.5 rounded-xl p-3 sm:mx-5">
                <div class="theme-text-muted flex items-start gap-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-guacamole-b shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span class="font-semibold leading-snug">Envío gratis en pedidos mayores a $50</span>
                </div>
                <div class="theme-text-muted flex items-start gap-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-guacamole-b shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-semibold leading-snug">Garantía de devolución de 30 días</span>
                </div>
              </div>

              {/* CTA Primary */}
                <div class="space-y-2 px-3.5 pb-3.5 sm:px-5 sm:pb-3">
                  <a
                    href="/checkout"
                  class="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-guacamole-b px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(86,130,3,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-guacamole-a hover:shadow-[0_6px_20px_rgba(62,97,2,0.35)] sm:px-6"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Revisar pedido
                  </a>
                  <p class="theme-soft-surface theme-text-muted rounded-2xl px-3 py-2 text-center text-[11px] font-medium leading-relaxed">
                    Revisá tu selección acá y, cuando quieras cerrar la compra, seguís al checkout con todo claro.
                  </p>
                  <div class="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                    <a href="/tienda" class="text-xs font-semibold text-guacamole-b transition-colors hover:text-guacamole-a">← Seguir comprando</a>
                    <button onClick={handleClearCart} class="theme-text-subtle text-xs font-semibold transition-colors hover:text-guacamole-b">Limpiar carrito</button>
                </div>
              </div>

              {/* Secure Badge */}
              <div class="px-3.5 pb-4 sm:px-5">
                <p class="theme-text-subtle flex items-center justify-center gap-1 text-center text-[11px] sm:text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Compra 100% segura
                </p>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </>
  );
}
