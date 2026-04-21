

import { emptyRecipe } from "@utils/recipe-calculator";
import { ensureFeaturedColumnExists, ensureImageMetaColumnsExist, ensureIsEnabledColumnExists, isMissingRecipeColumnError } from "@utils/product-db";
import { serializeProductSizes } from "@utils/product-sizes";
import { defineAction } from "astro:actions";
import { Category, db, eq, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import type { ProductRecipe } from "@interfaces/recipe.interface";
import { hasAdminAccess } from "../../firebase/guards";

type ProductBySlugRow = {
    id: string;
    title: string;
    description: string;
    price: number;
    sizes: string;
    slug: string;
    categoryId: string | null;
    recipe: ProductRecipe;
    featured: boolean;
    isEnabled: boolean;
};

const newProduct = {
      id: '',
      title: 'nuevo producto',
      description: 'descripcion',
      price: 0,
      sizes: serializeProductSizes(['Pequeño']),
      slug: '',
      recipe: null as string | null,
};

/** Parsea el JSON de receta guardado; devuelve emptyRecipe() si es nulo o inválido */
function parseRecipe(raw: string | null | undefined): ProductRecipe {
    if (!raw) return emptyRecipe();
    try {
        return JSON.parse(raw) as ProductRecipe;
    } catch {
        return emptyRecipe();
    }
}

async function findProductBySlug(slug: string, includeDisabled: boolean) {
    await ensureFeaturedColumnExists();
    await ensureIsEnabledColumnExists();
    await ensureImageMetaColumnsExist();

    try {
        const { rows } = await db.run(sql`
            SELECT id, title, description, price, sizes, slug, categoryId, recipe, featured, isEnabled
            FROM ${Product}
            WHERE slug = ${slug}
            ${includeDisabled ? sql`` : sql`AND COALESCE(isEnabled, 1) = 1`}
            LIMIT 1
        `);
        const productRow = rows[0] as Record<string, unknown> | undefined;

        if (!productRow) {
            return null;
        }

        return {
            ...productRow,
            sizes: serializeProductSizes(productRow.sizes as string | null | undefined),
            recipe: parseRecipe(productRow.recipe as string | null | undefined),
            featured: Boolean(productRow.featured),
            isEnabled: productRow.isEnabled === null || productRow.isEnabled === undefined ? true : Boolean(productRow.isEnabled),
        } as ProductBySlugRow;
    } catch (error) {
        if (!isMissingRecipeColumnError(error)) {
            throw error;
        }

        const { rows } = await db.run(sql`
            SELECT id, title, description, price, sizes, slug, categoryId, featured, isEnabled
            FROM ${Product}
            WHERE slug = ${slug}
            ${includeDisabled ? sql`` : sql`AND COALESCE(isEnabled, 1) = 1`}
            LIMIT 1
        `);
        const productRow = rows[0] as Record<string, unknown> | undefined;

        if (!productRow) {
            return null;
        }

        return {
            ...productRow,
            sizes: serializeProductSizes(productRow.sizes as string | null | undefined),
            recipe: emptyRecipe(),
            featured: Boolean(productRow.featured),
            isEnabled: productRow.isEnabled === null || productRow.isEnabled === undefined ? true : Boolean(productRow.isEnabled),
        } as ProductBySlugRow;
    }
}

export const getProductBySlug = defineAction({
        accept: 'json',
        input: z.string(),
        handler: async (slug, context) => {
            if (slug === 'new-product') {
                return {
                    product: { ...newProduct, recipe: emptyRecipe() },
                    images: [],
                };
            }

            const productRow = await findProductBySlug(slug, hasAdminAccess(context));
            if (!productRow) {
                throw new Error(`Producto de nombre ${slug} no encontrado`);
            }

            const { rows: imageRows } = await db.run(sql`
                SELECT id, productId, image, sortOrder, isCard
                FROM ${ProductImage}
                WHERE productId = ${productRow.id}
                ORDER BY COALESCE(sortOrder, 9999), rowid
            `);
            const images = (imageRows as any[]).map(r => ({
                id: r.id as string,
                productId: r.productId as string,
                image: r.image as string,
                sortOrder: r.sortOrder as number | null,
                isCard: Boolean(r.isCard),
            }));
            const [category] = productRow.categoryId
                ? await db.select().from(Category).where(eq(Category.id, productRow.categoryId))
                : [undefined];

            return {
                product: {
                    ...productRow,
                    categoryName: category?.name,
                    categorySlug: category?.slug,
                },
                images,
            };
        },
    });
