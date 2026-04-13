import { getAnalytics } from "./analytics/get-analytics";
import { createUpdateCategory } from "./categories/create-update-category.action";
import { deleteCategory } from "./categories/delete-category.action";
import { getCategories } from "./categories/get-categories";
import { createUpdateProduct } from "./products/create-update-product.action";
import { deleteProduct } from "./products/delete-product.action";
import { deleteProductImage } from "./products/delete-product-image.action";
import { getFeaturedProducts } from "./products/get-featured-products";
import { getProductBySlug } from "./products/get-product-by-slug";
import { getProductsByCategory } from "./products/get-products-by-category";
import { getProductsByPage } from "./products/getProducts";
import { loadProductsFromCart } from "./products/load-products-from-cart.action";
import { toggleFeatured } from "./products/toggle-featured.action";
import { login } from "./auth/login.action";
import { logout } from "./auth/logout.action";
import { createOrder } from "./orders/create-order.action";
import { getOrderByToken } from "./orders/get-order-by-token";
import { getOrders } from "./orders/get-orders";
import { deleteOrder } from "./orders/delete-order.action";
import { reviewPayment } from "./orders/review-payment.action";
import { uploadPaymentProof } from "./orders/upload-payment-proof.action";

export const server = {
    // ── Public actions (storefront) ──────────────────────────────────
    getProductsByPage,
    getProductsByCategory,
    getProductBySlug,
    getFeaturedProducts,
    loadProductsFromCart,
    createOrder,
    getOrderByToken,
    uploadPaymentProof,

    // ── Auth actions ─────────────────────────────────────────────────
    login,
    logout,

    // ── Admin actions (protected — require auth via guards) ───────────
    createUpdateProduct,
    deleteProduct,
    deleteProductImage,
    toggleFeatured,
    getCategories,
    createUpdateCategory,
    deleteCategory,
    getOrders,
    reviewPayment,
    deleteOrder,
    getAnalytics,
};
