

import { ImageUpload } from "@utils/image-upload";
import { isMissingRecipeColumnError } from "@utils/product-db";
import { defineAction } from "astro:actions";
import { db, eq, Product, ProductImage } from "astro:db";
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

        const buildQueries = (includeRecipe: boolean) => {
            const queries: any[] = [];
            const productForDb = includeRecipe
                ? (product as typeof product & { recipe: string | null })
                : rest;

            if (!form.id) {
                queries.push(db.insert(Product).values(includeRecipe ? productForDb : { id, ...rest }));
            } else {
                queries.push(
                    db.update(Product)
                        .set(includeRecipe ? productForDb : rest)
                        .where(eq(Product.id, id)),
                );
            }

            secureUrls.forEach((imageUrl) => {
                const imageObject = {
                    id: UUID(),
                    image: imageUrl,
                    productId: product.id,
                };
                queries.push(db.insert(ProductImage).values(imageObject));
            });

            return queries;
        };

        let recipeWasPersisted = true;

        try {
            await db.batch(buildQueries(true));
        } catch (error) {
            if (!isMissingRecipeColumnError(error)) {
                throw error;
            }

            recipeWasPersisted = false;
            await db.batch(buildQueries(false));
        }

        return {
            ...product,
            recipe: recipeWasPersisted ? recipeJson : null,
        };
    },
});
