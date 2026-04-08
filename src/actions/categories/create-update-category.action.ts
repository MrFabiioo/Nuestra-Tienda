

import { defineAction } from "astro:actions";
import { db, eq, Category } from "astro:db";
import { z } from "astro:schema";
import { v4 as UUID } from "uuid";
import { requireAuth } from "../../firebase/guards";

export const createUpdateCategory = defineAction({
    accept:'form',
    input:z.object({
        id: z.string().optional(),
        name: z.string().min(1, "El nombre es requerido"),
        slug: z.string().min(1, "El slug es requerido"),
    }),
    handler:async(form, context)=>{
        requireAuth(context);
        const { id = UUID(), name, slug } = form;
        
        // Normalize slug: lowercase, replace spaces with hyphens, trim
        const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-').trim();
        
        const category = {
            id,
            name,
            slug: normalizedSlug,
        };

        if (!form.id) {
            // Create new category
            await db.insert(Category).values(category);
        } else {
            // Update existing category
            await db.update(Category)
                .set({ name, slug: normalizedSlug })
                .where(eq(Category.id, id));
        }

        return {
            ok: true,
            category,
        };
    }
})
