
import { defineAction } from "astro:actions";
import { db, Category } from "astro:db";
import { z } from "astro:schema";

export const getCategories = defineAction({
    accept:'json',
    input:z.object({}).optional(),
    handler:async()=>{
        const categories = await db.select().from(Category);
        
        return {
            categories: categories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
            })),
        };
    }
})
