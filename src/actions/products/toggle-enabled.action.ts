import { defineAction } from "astro:actions";
import { db, Product, sql } from "astro:db";
import { z } from "astro:schema";
import { requireAuth } from "../../firebase/guards";
import { ensureIsEnabledColumnExists } from "@utils/product-db";

export const toggleEnabled = defineAction({
    accept: 'json',
    input: z.object({
        id:        z.string(),
        isEnabled: z.boolean(),
    }),
    handler: async ({ id, isEnabled }, context) => {
        requireAuth(context);
        await ensureIsEnabledColumnExists();
        await db.run(sql`UPDATE ${Product} SET isEnabled = ${isEnabled ? 1 : 0} WHERE id = ${id}`);
        return { success: true, isEnabled };
    },
});
