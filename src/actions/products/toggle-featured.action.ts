import { defineAction } from "astro:actions";
import { db, Product, sql } from "astro:db";
import { z } from "astro:schema";
import { requireAdminAccess } from "../../firebase/guards";
import { ensureFeaturedColumnExists } from "@utils/product-db";

export const toggleFeatured = defineAction({
    accept: 'json',
    input: z.object({
        id:       z.string(),
        featured: z.boolean(),
    }),
    handler: async ({ id, featured }, context) => {
        requireAdminAccess(context, 'destacar productos');
        await ensureFeaturedColumnExists();
        // Raw SQL — el ORM de Astro DB convierte boolean JS a "None" en SQLite
        await db.run(sql`UPDATE ${Product} SET featured = ${featured ? 1 : 0} WHERE id = ${id}`);
        return { success: true, featured };
    },
});
