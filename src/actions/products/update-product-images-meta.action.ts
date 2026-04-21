import { defineAction } from "astro:actions";
import { db, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { requireAdminAccess } from "../../firebase/guards";
import { ensureImageMetaColumnsExist } from "@utils/product-db";

export const updateProductImagesMeta = defineAction({
  accept: 'json',
  input: z.object({
    images: z.array(z.object({
      id: z.string(),
      sortOrder: z.number(),
      isCard: z.boolean(),
    })),
  }),
  handler: async (input, context) => {
    requireAdminAccess(context, 'gestionar imágenes de productos');
    await ensureImageMetaColumnsExist();

    for (const img of input.images) {
      await db.run(sql`
        UPDATE ${ProductImage}
        SET sortOrder = ${img.sortOrder}, isCard = ${img.isCard ? 1 : 0}
        WHERE id = ${img.id}
      `);
    }

    return { ok: true };
  },
});
