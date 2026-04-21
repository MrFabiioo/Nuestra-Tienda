import { defineAction } from "astro:actions";
import { db, inArray, Product, ProductImage, sql } from "astro:db";
import { ensureImageMetaColumnsExist, ensureIsEnabledColumnExists } from "@utils/product-db";
import { resolveProductImageUrl } from "@utils/product-images";
import { parseCartCookie } from "../../services/orders/cart-cookie";

type RemovedCartItem = {
    productId: string;
    title: string;
    size: string;
    reason: 'missing' | 'disabled';
};

export const loadProductsFromCart= defineAction({
        accept:'json',
        handler:async(_,{cookies})=>{
            const cart = parseCartCookie(cookies.get('cart')?.value);
            if(cart.length ===0) {
                return {
                    products: [],
                    removedItems: [] as RemovedCartItem[],
                };
            }

            await ensureImageMetaColumnsExist();
            await ensureIsEnabledColumnExists();

            const productIds = [...new Set(cart.map((item)=>item.productId))];

            const products = await db.select().from(Product).where(inArray(Product.id, productIds));
            const productMap = new Map(products.map((product) => [product.id, product]));
            const availableProductIds = new Set(
                products
                    .filter((product) => product.isEnabled === null || product.isEnabled === undefined || Boolean(product.isEnabled))
                    .map((product) => product.id),
            );

            const removedItems = cart.flatMap<RemovedCartItem>((item) => {
                const product = productMap.get(item.productId);

                if (!product) {
                    return [{
                        productId: item.productId,
                        title: item.name?.trim() || 'Producto no disponible',
                        size: item.size,
                        reason: 'missing' as const,
                    }];
                }

                if (availableProductIds.has(item.productId)) {
                    return [];
                }

                return [{
                    productId: item.productId,
                    title: product.title,
                    size: item.size,
                    reason: 'disabled' as const,
                }];
            });

            const sanitizedCart = cart.filter((item) => availableProductIds.has(item.productId));

            if (removedItems.length > 0) {
                if (sanitizedCart.length === 0) {
                    cookies.delete('cart', { path: '/' });
                } else {
                    cookies.set('cart', JSON.stringify(sanitizedCart), { path: '/' });
                }
            }

            if (sanitizedCart.length === 0) {
                return {
                    products: [],
                    removedItems,
                };
            }

            const imageMap = new Map<string, string>();
            const imageRows = await Promise.all(
                [...new Set(sanitizedCart.map((item) => item.productId))].map(async (productId) => {
                    const { rows } = await db.run(sql`
                        SELECT image
                        FROM ${ProductImage}
                        WHERE productId = ${productId}
                        ORDER BY COALESCE(isCard, 0) DESC, COALESCE(sortOrder, 9999), rowid
                        LIMIT 1
                    `);

                    return {
                        productId,
                        image: (rows[0] as { image?: string | null } | undefined)?.image ?? null,
                    };
                }),
            );

            for (const imageRow of imageRows) {
                if (!imageRow.image) continue;
                imageMap.set(imageRow.productId, imageRow.image);
            }

            return {
                products: sanitizedCart.map(item =>{
                const product = productMap.get(item.productId);
                if (!product) {
                    return null;
                }

                const image = imageMap.get(item.productId) ?? null;

                return {
                    productId: item.productId,
                    title: product.title,
                    sizes: item.size,
                    quantity: item.quantity,
                    price: product.price,
                    slug: product.slug,
                    image: resolveProductImageUrl(image, {
                        baseUrl: import.meta.env.PUBLIC_URL,
                    })
                };
            }).filter((item): item is NonNullable<typeof item> => item !== null),
                removedItems,
            };
        }
    })
