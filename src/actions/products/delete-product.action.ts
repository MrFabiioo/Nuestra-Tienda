
import { defineAction } from "astro:actions";
import { db, eq, Product, ProductImage } from "astro:db";
import { ImageUpload } from "@utils/image-upload";
import { z } from "astro:schema";
import { requireAuth } from "../../firebase/guards";

export const deleteProduct = defineAction({
    accept: 'json',
    input: z.object({
        id: z.string(),
    }),
    handler: async ({ id }, context) => {
        requireAuth(context);
        // 1. Fetch all images associated with the product
        const images = await db
            .select()
            .from(ProductImage)
            .where(eq(ProductImage.productId, id));

        // 2. Delete images from cloud storage (Cloudinary, etc.) if hosted remotely
        await Promise.all(
            images
                .filter((img) => img.image.includes('http'))
                .map((img) => ImageUpload.delete(img.image))
        );

        // 3. Delete image rows from DB
        await db.delete(ProductImage).where(eq(ProductImage.productId, id));

        // 4. Delete the product itself
        await db.delete(Product).where(eq(Product.id, id));

        return { ok: true };
    },
});
