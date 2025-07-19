// Adjust the import path as necessary
import { useCartStore } from '../store/useCartStore';
import { useState } from 'preact/hooks'
import Cart from './svgs/Cart';


export default function ShoppingCart() {
  //
  const [isOpen, setIsOpen] = useState(false);
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      <button onClick={toggleCart} class="active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl relative">
        <Cart />
        <p class="bg-guacamole-a rounded-full absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">3</p>
      </button>
      {isOpen && (
        <div class="absolute top-full right-2 mt-2 w-80 bg-guacamole-a border-2 border-black   p-6 z-50 flex flex-col gap-4">
          <div class="flex items-center justify-between mb-2">
            <Cart />
            <h2 class="font-extrabold text-2xl text-guacamole-pulpa uppercase">Tu carrito</h2>
            <button
              onClick={toggleCart}
              class="text-guacamole-pulpa hover:text-guacamole-a font-bold text-xl transition-colors"
              title="Cerrar"
            >
              ×
            </button>
          </div>
          <div class="flex items-center gap-3">
            <img src="/images/guacamoleIA.png" alt="Guacamole" class="w-12 h-12 border-2 border-black shadow-[2px_2px_0_0_#3E6102]" />
            <div>
              <p class="text-guacamole-pulpa font-bold uppercase">Tazón de Guacamole</p>
              <p class="text-guacamole-e font-bold">x 3</p>
            </div>
            <span class="ml-auto text-lg font-bold text-guacamole-pulpa">${(9000 * 3).toFixed(0)}</span>
          </div>
          <div class="border-t-2 border-black pt-3 flex flex-col gap-2">
            <p class="text-sm text-guacamole-pulpa uppercase">✔ Envío gratis en pedidos mayores a $50</p>
            <p class="text-sm text-guacamole-pulpa uppercase">✔ Garantía de devolución de 30 días</p>
          </div>


          <a class="group relative focus:ring-3 focus:outline-hidden" href="/checkout">
            <span
              class=" absolute inset-0 translate-x-1.5 translate-y-1.5 bg-guacamole-f transition-transform group-hover:translate-x-0 group-hover:translate-y-0"
            ></span>

            <span
              class="relative w-full inline-block border-2 border-current px-8 py-3 text-sm font-bold tracking-widest text-black uppercase text-center"
            >
              Ir a pagar
            </span>
          </a>
        </div>
      )}
    </>
  );
}