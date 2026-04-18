import { defineAction } from "astro:actions";
import { Category, db, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { resolveProductImageUrl } from "@utils/product-images";
import { ensureImageMetaColumnsExist, ensureIsEnabledColumnExists } from "@utils/product-db";

interface ProductByCategory {
    categoryId: string;
    categoryName: string;
    products: {
        id: string;
        title: string;
        description: string;
        price: number;
        sizes: string;
        slug: string;
        image: string;
        isEnabled: boolean;
    }[];
}

export const getProductsByCategory = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async () => {
        await ensureIsEnabledColumnExists();
        await ensureImageMetaColumnsExist();
        // Get all categories
        const categories = await db.select().from(Category);

        // Get all products with their first image and category name
        const productQuery = sql`
            SELECT
                a.id,
                a.title,
                a.description,
                a.price,
                a.sizes,
                a.slug,
                a.categoryId,
                a.isEnabled,
                (SELECT name FROM ${Category} WHERE id = a.categoryId) as categoryName,
                COALESCE(
                    (SELECT image FROM ${ProductImage} WHERE productId = a.id AND isCard = 1 LIMIT 1),
                    (SELECT image FROM ${ProductImage} WHERE productId = a.id ORDER BY COALESCE(sortOrder, 9999), rowid LIMIT 1)
                ) as image
            FROM ${Product} a
            ORDER BY a.categoryId, COALESCE(a.isEnabled, 1) DESC, a.title;
        `;
        
        const { rows } = await db.run(productQuery);
        
        // Group products by category
        const productsByCategory: ProductByCategory[] = [];
        
        // Handle products without category (uncategorized)
        const uncategorizedProducts: typeof rows = [];
        const categorizedProducts: { [key: string]: typeof rows } = {};
        
        rows.forEach((product: any) => {
            const catId = product.categoryId || 'uncategorized';
            if (!product.categoryId) {
                uncategorizedProducts.push(product);
            } else {
                if (!categorizedProducts[catId]) {
                    categorizedProducts[catId] = [];
                }
                categorizedProducts[catId].push(product);
            }
        });
        
        // Add categorized products
        categories.forEach(category => {
            const products = categorizedProducts[category.id] || [];
            if (products.length > 0) {
                productsByCategory.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    products: products.map((p: any) => ({
                        id: String(p.id),
                        title: String(p.title),
                        description: String(p.description),
                        price: Number(p.price),
                        sizes: String(p.sizes),
                        slug: String(p.slug),
                        image: resolveProductImageUrl(String(p.image ?? ''), {
                            baseUrl: import.meta.env.PUBLIC_URL,
                        }),
                        isEnabled: p.isEnabled === null || p.isEnabled === undefined ? true : Boolean(p.isEnabled),
                    }))
                });
            }
        });
        
        // Add uncategorized products if any
        if (uncategorizedProducts.length > 0) {
            productsByCategory.push({
                categoryId: 'uncategorized',
                categoryName: 'Sin Categoría',
                products: uncategorizedProducts.map((p: any) => ({
                    id: String(p.id),
                    title: String(p.title),
                    description: String(p.description),
                    price: Number(p.price),
                    sizes: String(p.sizes),
                    slug: String(p.slug),
                    image: resolveProductImageUrl(String(p.image ?? ''), {
                        baseUrl: import.meta.env.PUBLIC_URL,
                    }),
                    isEnabled: p.isEnabled === null || p.isEnabled === undefined ? true : Boolean(p.isEnabled),
                }))
            });
        }
        
        return {
            productsByCategory
        };
    }
});
