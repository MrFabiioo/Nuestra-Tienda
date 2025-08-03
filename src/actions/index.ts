import { createUpdateProduct } from "./products/create-update-product.action";
import { getProductBySlug } from "./products/get-product-by-slug";
import { getProductsByPage } from "./products/getProducts";
import { loadProductsFromCart } from "./products/load-products-from-cart.action";

export const server ={
    getProductsByPage,
    getProductBySlug,
    loadProductsFromCart,
    createUpdateProduct
};