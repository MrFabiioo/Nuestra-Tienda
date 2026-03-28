
import { defineAction } from "astro:actions";
import { db, eq, Category, Product } from "astro:db";
import { z } from "astro:schema";

export const deleteCategory = defineAction({
    accept:'json',
    input:z.object({
        id: z.string(),
    }),
    handler:async({id})=>{
        // TODO: Check if any products reference this category before deleting
        // For now, we'll just delete. A production version should:
        // 1. Check if products.categoryId === id exists
        // 2. Either block deletion or cascade/reset the categoryId on products
        
        await db.delete(Category).where(eq(Category.id, id));

        return {
            ok: true,
        };
    }
})
