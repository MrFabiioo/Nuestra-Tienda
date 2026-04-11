

import { ImageUpload } from "@utils/image-upload";
import { isMissingRecipeColumnError } from "@utils/product-db";
import { defineAction } from "astro:actions";
import { db, eq, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { v4 as UUID } from "uuid";
import { requireAuth } from "../../firebase/guards";

const MAX_FILE_SIZE = 5_000_000; // 5MB
const ACEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
];

/** Schema Zod para un ingrediente individual recibido vía form (JSON string) */
const ingredientSchema = z.object({
    name: z.string(),
    paidAmount: z.number().min(0),
    purchasedQty: z.number().positive(),
    purchasedUnit: z.enum(['gr', 'kg', 'ml', 'cc', 'l', 'unidad']),
    usedQty: z.number().positive(),
    usedUnit: z.enum(['gr', 'kg', 'ml', 'cc', 'l', 'unidad']),
});

/** Schema Zod para la receta completa recibida como JSON string en el form */
const recipeSchema = z.object({
    ingredients: z.array(ingredientSchema),
    yieldUnits: z.number().positive(),
    marginPercent: z.number().min(0).nullable(),
});

export const createUpdateProduct = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string(),
        price: z.number(),
        sizes: z.string(),
        slug: z.string(),
        categoryId: z.string().optional(),
        // La receta se envía serializada como JSON en un campo oculto
        recipe: z.string().optional(),

        imageFiles: z.array(
            z.instanceof(File)
                .refine((file) => file.size <= MAX_FILE_SIZE, 'Max image size 5MB')
                .refine(
                    (file) => { if (file.size === 0) return true; return ACEPTED_IMAGE_TYPES.includes(file.type); },
                    `, ${ACEPTED_IMAGE_TYPES.join(',')}`,
                ),
        ).optional(),
    }),
    handler: async (form, context) => {
        requireAuth(context);

        const { id = UUID(), imageFiles, recipe: recipeRaw, ...rest } = form;
        rest.slug = rest.slug.toLowerCase().replace(/ /g, '-').trim();

        // Validar y serializar la receta; si no viene o es inválida, no se guarda
        let recipeJson: string | null = null;
        if (recipeRaw) {
            try {
                const parsed = JSON.parse(recipeRaw);
                const validated = recipeSchema.safeParse(parsed);
                recipeJson = validated.success ? JSON.stringify(validated.data) : null;
            } catch {
                recipeJson = null;
            }
        }

        const product = {
            id,
            ...rest,
            recipe: recipeJson,
        };

        const secureUrls: string[] = [];
        if (form.imageFiles && form.imageFiles.length > 0 && form.imageFiles[0].size > 0) {
            const urls = await Promise.all(
                form.imageFiles.map((file) => ImageUpload.upload(file)),
            );
            secureUrls.push(...urls);
        }

        const persistProduct = async (includeRecipe: boolean) => {
            if (!form.id) {
                if (includeRecipe) {
                    await db.run(sql`
                        insert into ${Product} (id, title, description, price, sizes, slug, categoryId, recipe)
                        values (${id}, ${rest.title}, ${rest.description}, ${rest.price}, ${rest.sizes}, ${rest.slug}, ${rest.categoryId ?? null}, ${recipeJson})
                    `);
                } else {
                    await db.run(sql`
                        insert into ${Product} (id, title, description, price, sizes, slug, categoryId)
                        values (${id}, ${rest.title}, ${rest.description}, ${rest.price}, ${rest.sizes}, ${rest.slug}, ${rest.categoryId ?? null})
                    `);
                }
            } else if (includeRecipe) {
                await db.run(sql`
                    update ${Product}
                    set title = ${rest.title}, description = ${rest.description}, price = ${rest.price}, sizes = ${rest.sizes}, slug = ${rest.slug}, categoryId = ${rest.categoryId ?? null}, recipe = ${recipeJson}
                    where id = ${id}
                `);
            } else {
                await db.run(sql`
                    update ${Product}
                    set title = ${rest.title}, description = ${rest.description}, price = ${rest.price}, sizes = ${rest.sizes}, slug = ${rest.slug}, categoryId = ${rest.categoryId ?? null}
                    where id = ${id}
                `);
            }

            for (const imageUrl of secureUrls) {
                await db.run(sql`
                    insert into ${ProductImage} (id, image, productId)
                    values (${UUID()}, ${imageUrl}, ${product.id})
                `);
            }
        };

        let recipeWasPersisted = true;

        try {
            await persistProduct(true);
        } catch (error) {
            if (!isMissingRecipeColumnError(error)) {
                throw error;
            }

            recipeWasPersisted = false;
            await persistProduct(false);
        }

        return {
            ...product,
            recipe: recipeWasPersisted ? recipeJson : null,
        };
    },
});
