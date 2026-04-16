

import { emptyRecipe } from "@utils/recipe-calculator";
import { ensureFeaturedColumnExists, ensureIsEnabledColumnExists, isMissingRecipeColumnError } from "@utils/product-db";
import { defineAction } from "astro:actions";
import { Category, db, eq, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import type { ProductRecipe } from "@interfaces/recipe.interface";

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
      sizes: 'Pequeño',
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

async function findProductBySlug(slug: string) {
    await ensureFeaturedColumnExists();
    await ensureIsEnabledColumnExists();

    try {
        const { rows } = await db.run(sql`
            SELECT id, title, description, price, sizes, slug, categoryId, recipe, featured, isEnabled
            FROM ${Product}
            WHERE slug = ${slug}
            LIMIT 1
        `);
        const productRow = rows[0] as Record<string, unknown> | undefined;

        if (!productRow) {
            return null;
        }

        return {
            ...productRow,
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
            LIMIT 1
        `);
        const productRow = rows[0] as Record<string, unknown> | undefined;

        if (!productRow) {
            return null;
        }

        return {
            ...productRow,
            recipe: emptyRecipe(),
            featured: Boolean(productRow.featured),
            isEnabled: productRow.isEnabled === null || productRow.isEnabled === undefined ? true : Boolean(productRow.isEnabled),
        } as ProductBySlugRow;
    }
}

export const getProductBySlug = defineAction({
        accept: 'json',
        input: z.string(),
        handler: async (slug) => {
            if (slug === 'new-product') {
                return {
                    product: { ...newProduct, recipe: emptyRecipe() },
                    images: [],
                };
            }

            const productRow = await findProductBySlug(slug);
            if (!productRow) {
                throw new Error(`Producto de nombre ${slug} no encontrado`);
            }

            const images = await db.select().from(ProductImage).where(eq(ProductImage.productId, productRow.id));
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
