// Adjust the import path as necessary
import { useCartStore } from '../store/useCartStore';


export default function ButtonAddToCart() {
    const addToCart = useCartStore((state) => state.addToCart);

    return (
        <button onClick={() => { addToCart(1); }} class="group relative inline-block focus:ring-3 focus:outline-hidden w-fit active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all">
            <span
                class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-guacamole-f transition-transform group-hover:translate-x-0 group-hover:translate-y-0 "
            ></span>

            <span
                class="relative inline-block border-2 border-current px-8 py-3 text-sm font-bold tracking-widest text-black uppercase "
            >
                Añadir al carrito 🥑
            </span>
        </button>
    )
}