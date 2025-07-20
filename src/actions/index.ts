import { getProductBySlug } from "./products/get-product-by-slug";
import { getProductsByPage } from "./products/getProducts";

export const server ={
    getProductsByPage,
    getProductBySlug,
};