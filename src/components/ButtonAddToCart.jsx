 // Adjust the import path as necessary
import { useCartStore } from '../store/useCartStore';


export default function ButtonAddToCart() {
    const addToCart = useCartStore((state) => state.addToCart);

    return(
        <button onClick={() => { console.log("Adding to cart");addToCart(1);}} class="bg-guacamole-f text-amber-950 font-bold border-4  border-black rounded-lg px-3 md:px-6 py-1 md:py-3 shadow-[4px_4px_0_0_#3E6102] hover:shadow-[2px_2px_0_0_#3E6102] active:translate-y-1 active:shadow-[0px_0px_0_0_#3E6102] transition-all text-sm md:text-xl">
                Añadir al carrito + 🥑
            </button>
    )
}