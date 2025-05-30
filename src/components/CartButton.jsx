 // Adjust the import path as necessary
import { useCartStore } from '../store/useCartStore';
import {useState} from 'preact/hooks'

export default function ShoppingCart() {
  const count = useCartStore((state) => state.count);
  const [isOpen, setIsOpen] = useState(false);
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
    <button onClick={toggleCart} class="active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl relative">
      <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 32 32"><path fill="currentColor" d="M28.778 5H29c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1c0 .415.256.772.617.923L26.34 6H5.2C3.44 6 2 7.432 2 9.253l.52 8.495c.15 2.517 2.52 3.84 4.65 4.009l14.832 1.169c-.028.476.303.928.802 1.045c.572.131 1.144-.193 1.282-.74l1.064-4.134c1.068.334 1.863 1.489 1.863 2.788V22c0 1.608-1.204 3-2.635 3H3c-.547 0-1 .382-1 .956S2.447 27 2.994 27H5.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3h18a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3h.919C26.943 27 29 24.756 29 22v-.115c0-2.268-1.424-4.18-3.351-4.728zm-7.162 11H20v-4h2.605zm1.236-5H20V8.007l1.95.002c.84 0 1.45.776 1.25 1.582zM19 8.006V11h-4.38V8zm-5.38-.007V11h-4.6V7.994zm-5.6-.006V11H4.111L4 9.193c0-.666.54-1.204 1.21-1.204zM4.173 12H8.02v4h-3.6zm.308 5H8.02v2.83l-.68-.053c-1.34-.11-2.74-.875-2.82-2.149zm4.539 2.91V17h4.6v3.272zm5.6.44V17H19v3.62q0 .039.006.076zm5.38.25V17h1.369l-.679 2.747a1.28 1.28 0 0 1-.69.853M14.62 12H19v4h-4.38zm-5.6 0h4.6v4h-4.6z"/></svg>
      <p class="bg-guacamole-a rounded-full absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">{count}</p>
    </button>
    {isOpen && (
  <div class="absolute top-full right-2 mt-2 w-80 bg-guacamole-f border-4 border-black rounded-2xl shadow-[6px_6px_0_0_#3E6102] p-6 z-50 flex flex-col gap-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-extrabold text-2xl text-amber-950">🛒 Tu carrito</h2>
      <button
        onClick={toggleCart}
        class="text-amber-950 hover:text-guacamole-a font-bold text-xl transition-colors"
        title="Cerrar"
      >
        ×
      </button>
    </div>
    <div class="flex items-center gap-3">
      <img src="/guacamoleIA.png" alt="Guacamole" class="w-12 h-12 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#3E6102]" />
      <div>
        <p class="text-amber-950 font-bold">Tazón de Guacamole</p>
        <p class="text-guacamole-a font-bold">x{count}</p>
      </div>
      <span class="ml-auto text-lg font-bold text-amber-950">${(9000 * count).toFixed(0)}</span>
    </div>
    <div class="border-t-2 border-black pt-3 flex flex-col gap-2">
      <p class="text-sm text-amber-950">✔ Envío gratis en pedidos mayores a $50</p>
      <p class="text-sm text-amber-950">✔ Garantía de devolución de 30 días</p>
    </div>
    <a
      href="/checkout"
      class="block bg-guacamole-f text-amber-950 font-bold border-4  border-black rounded-lg px-3 md:px-6 py-1 md:py-3 shadow-[4px_4px_0_0_#3E6102] hover:bg-guacamole-b active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl text-center"
    >
      Ir a pagar
    </a>
  </div>
    )}
    </>
  );
}