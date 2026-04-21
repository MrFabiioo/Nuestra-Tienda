

import { ImageUpload } from "@utils/image-upload";
import { runInTransaction } from "../../services/data/transaction-runner";
import { isMissingRecipeColumnError } from "@utils/product-db";
import { serializeProductSizes } from "@utils/product-sizes";
import { ActionError, defineAction } from "astro:actions";
import { Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { v4 as UUID } from "uuid";
import { requireAdminAccess } from "../../firebase/guards";

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
        requireAdminAccess(context, 'gestionar productos');

        const { id = UUID(), imageFiles, recipe: recipeRaw, ...rest } = form;
        rest.slug = rest.slug.toLowerCase().replace(/ /g, '-').trim();

        const normalizedSizes = serializeProductSizes(rest.sizes);
        if (!normalizedSizes) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: 'Agregá al menos un tamaño disponible antes de guardar el producto.',
            });
        }
        rest.sizes = normalizedSizes;

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

        const uploadedAssets: Awaited<ReturnType<typeof ImageUpload.uploadDetailed>>[] = [];
        if (form.imageFiles && form.imageFiles.length > 0 && form.imageFiles[0].size > 0) {
            try {
                for (const file of form.imageFiles) {
                    const asset = await ImageUpload.uploadDetailed(file);
                    uploadedAssets.push(asset);
                }
            } catch (error) {
                await Promise.all(
                    uploadedAssets.map((asset) => ImageUpload.deleteAsset(asset.publicId, 'image')),
                );
                throw error;
            }
        }

        const persistProduct = async (includeRecipe: boolean) => {
            await runInTransaction(async (session) => {
                if (!form.id) {
                    if (includeRecipe) {
                        await session.run(sql`
                            insert into ${Product} (id, title, description, price, sizes, slug, categoryId, recipe)
                            values (${id}, ${rest.title}, ${rest.description}, ${rest.price}, ${rest.sizes}, ${rest.slug}, ${rest.categoryId ?? null}, ${recipeJson})
                        `);
                    } else {
                        await session.run(sql`
                            insert into ${Product} (id, title, description, price, sizes, slug, categoryId)
                            values (${id}, ${rest.title}, ${rest.description}, ${rest.price}, ${rest.sizes}, ${rest.slug}, ${rest.categoryId ?? null})
                        `);
                    }
                } else if (includeRecipe) {
                    await session.run(sql`
                        update ${Product}
                        set title = ${rest.title}, description = ${rest.description}, price = ${rest.price}, sizes = ${rest.sizes}, slug = ${rest.slug}, categoryId = ${rest.categoryId ?? null}, recipe = ${recipeJson}
                        where id = ${id}
                    `);
                } else {
                    await session.run(sql`
                        update ${Product}
                        set title = ${rest.title}, description = ${rest.description}, price = ${rest.price}, sizes = ${rest.sizes}, slug = ${rest.slug}, categoryId = ${rest.categoryId ?? null}
                        where id = ${id}
                    `);
                }

                for (const asset of uploadedAssets) {
                    await session.run(sql`
                        insert into ${ProductImage} (id, image, productId)
                        values (${UUID()}, ${asset.secureUrl}, ${product.id})
                    `);
                }
            });
        };

        let recipeWasPersisted = true;

        try {
            await persistProduct(true);
        } catch (error) {
            if (isMissingRecipeColumnError(error)) {
                recipeWasPersisted = false;
                try {
                    await persistProduct(false);
                } catch (persistFallbackError) {
                    await Promise.all(
                        uploadedAssets.map((asset) => ImageUpload.deleteAsset(asset.publicId, 'image')),
                    );
                    throw persistFallbackError;
                }

                return {
                    ...product,
                    recipe: null,
                };
            }

            await Promise.all(
                uploadedAssets.map((asset) => ImageUpload.deleteAsset(asset.publicId, 'image')),
            );
            throw error;
        }

        return {
            ...product,
            recipe: recipeWasPersisted ? recipeJson : null,
        };
    },
});
