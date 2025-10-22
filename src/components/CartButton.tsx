
import { useState,useEffect } from 'preact/hooks'
import {useStore} from '@nanostores/preact'
import Cart from './svgs/Cart';
import { itemsIncart } from 'src/store/cart.store';
import { CartCookiesClient } from '@utils/cart-cookies';
import type { ShoppingCartProps } from 'src/interfaces/shoppin-cart';


export default function ShoppingCart() {
  const $itemsInCart = useStore(itemsIncart)
  const [isOpen, setIsOpen] = useState(false);
  const cart = CartCookiesClient.getCart();
  //console.log('cart: ',cart)
 
  useEffect(()=>{
    
    itemsIncart.set(cart.length)
  })
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };


  return (
    <>
      <button onClick={toggleCart} class="active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl relative">
        <Cart />
        {
          cart.length >0 && <p class="bg-guacamole-a rounded-full absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">{$itemsInCart}</p>
        }
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

                {
        cart?.map((product) => (
          <div class="flex gap-5 mt-5">
            <img src={product.image} alt={product.name} class="w-20 h-20" />

            <div>
              <p class="">
                {product.name}
              </p>
              <p>${product.price}</p>
              <p>Cantidad: {product.quantity}</p>
              <p>
                Tipo: <span class="font-bold">{product.size}</span>
              </p>
              
            </div>
          </div>
        ))
      }

          
          <div class="border-t-2 border-black pt-3 flex flex-col gap-2">
            <p class="text-sm text-guacamole-pulpa uppercase">✔ Envío gratis en pedidos mayores a $50</p>
            <p class="text-sm text-guacamole-pulpa uppercase">✔ Garantía de devolución de 30 días</p>
          </div>


          <a class="group relative focus:ring-3 focus:outline-hidden" href="/cart">
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

// TODO: arreglar el bug de actualizacion de cantidad sin tener que cerrar y abrir el carrito.
//TODO: agregar boton para eliminar productos del carrito.
//TODO: agregar boton para vaciar el carrito.
//TODO: cerrar carrito al hacer click fuera del carrito.
//TODO: agregar barra de desplazamiento si hay muchos productos en el carrito.