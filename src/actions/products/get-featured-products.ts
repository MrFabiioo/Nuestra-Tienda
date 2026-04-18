import { defineAction } from "astro:actions";
import { db, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { resolveProductImageUrl } from "@utils/product-images";
import { ensureFeaturedColumnExists, ensureImageMetaColumnsExist } from "@utils/product-db";

export const getFeaturedProducts = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async () => {
        await ensureFeaturedColumnExists();
        await ensureImageMetaColumnsExist();

        const query = sql`
            SELECT p.id, p.title, p.slug,
                COALESCE(
                    (SELECT image FROM ${ProductImage} WHERE productId = p.id AND isCard = 1 LIMIT 1),
                    (SELECT image FROM ${ProductImage} WHERE productId = p.id ORDER BY COALESCE(sortOrder, 9999), rowid LIMIT 1)
                ) AS image
            FROM ${Product} p
            WHERE p.featured = 1
            ORDER BY p.title ASC
        `;
        const { rows } = await db.run(query);
        return {
            products: (rows as any[]).map(r => ({
                id:    r.id    as string,
                title: r.title as string,
                slug:  r.slug  as string,
                image: resolveProductImageUrl(r.image as string | null, {
                    baseUrl: import.meta.env.PUBLIC_URL,
                }),
            })),
        };
    },
});
