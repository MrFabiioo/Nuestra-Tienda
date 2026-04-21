
import { ActionError, defineAction } from "astro:actions";
import { db, eq, Category, Product, sql } from "astro:db";
import { z } from "astro:schema";
import { requireAdminAccess } from "../../firebase/guards";

export const deleteCategory = defineAction({
    accept:'json',
    input:z.object({
        id: z.string(),
    }),
    handler:async({id}, context)=>{
        requireAdminAccess(context, 'eliminar categorías');

        await db.transaction(async (tx) => {
            const result = await tx.run(sql`
                DELETE FROM ${Category}
                WHERE id = ${id}
                  AND NOT EXISTS (
                    SELECT 1
                    FROM ${Product}
                    WHERE categoryId = ${id}
                    LIMIT 1
                  )
            `);

            if (result.rowsAffected > 0) {
                return;
            }

            const [category] = await tx.select({ id: Category.id }).from(Category).where(eq(Category.id, id)).limit(1);

            if (!category) {
                throw new ActionError({
                    code: 'NOT_FOUND',
                    message: 'No encontramos la categoría que intentas eliminar.',
                });
            }

            throw new ActionError({
                code: 'FORBIDDEN',
                message: 'No se puede eliminar la categoría porque todavía hay productos asociados.',
            });
        });

        return {
            ok: true,
        };
    }
})
