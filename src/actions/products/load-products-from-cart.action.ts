

import type { CartItem } from "@interfaces/cart-item";
import { defineAction } from "astro:actions";
import { db, inArray, Product, ProductImage, sql } from "astro:db";
import { ensureImageMetaColumnsExist } from "@utils/product-db";
import { resolveProductImageUrl } from "@utils/product-images";

export const loadProductsFromCart= defineAction({
        accept:'json',
        handler:async(_,{cookies})=>{
            const cart = JSON.parse(cookies.get('cart')?.value ?? '[]') as CartItem[];
            if(cart.length ===0) return [];

            await ensureImageMetaColumnsExist();

            const productIds = cart.map((item)=>item.productId);

            const products = await db.select().from(Product).where(inArray(Product.id, productIds));

            const imageMap = new Map<string, string>();
            await Promise.all(products.map(async (product) => {
                const { rows } = await db.run(sql`
                    SELECT COALESCE(
                        (SELECT image FROM ${ProductImage} WHERE productId = ${product.id} AND isCard = 1 LIMIT 1),
                        (SELECT image FROM ${ProductImage} WHERE productId = ${product.id} ORDER BY COALESCE(sortOrder, 9999), rowid LIMIT 1)
                    ) as image
                `);
                const image = (rows[0] as any)?.image as string | null;
                if (image) imageMap.set(product.id, image);
            }));

            return cart.map(item =>{
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new Error(`ERROR: el producto con id: ${item.productId} no fue encontrado !!!`);
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
            });
        }
    })
