import { createUpdateCategory } from "./categories/create-update-category.action";
import { deleteCategory } from "./categories/delete-category.action";
import { getCategories } from "./categories/get-categories";
import { createUpdateProduct } from "./products/create-update-product.action";
import { deleteProduct } from "./products/delete-product.action";
import { deleteProductImage } from "./products/delete-product-image.action";
import { getProductBySlug } from "./products/get-product-by-slug";
import { getProductsByCategory } from "./products/get-products-by-category";
import { getProductsByPage } from "./products/getProducts";
import { loadProductsFromCart } from "./products/load-products-from-cart.action";

export const server ={
    getProductsByPage,
    getProductsByCategory,
    getProductBySlug,
    loadProductsFromCart,
    createUpdateProduct,
    deleteProduct,
    deleteProductImage,
    getCategories,
    createUpdateCategory,
    deleteCategory,
};