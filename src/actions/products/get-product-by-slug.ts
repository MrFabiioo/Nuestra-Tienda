

import { emptyRecipe } from "@utils/recipe-calculator";
import { isMissingRecipeColumnError, productBaseSelection } from "@utils/product-db";
import { defineAction } from "astro:actions";
import { Category, db, eq, Product, ProductImage } from "astro:db";
import { z } from "astro:schema";
import type { ProductRecipe } from "@interfaces/recipe.interface";

const newProduct = {
      id: '',
      title: 'nuevo producto',
      description: 'descripcion',
      price: 0,
      sizes: 'Pequeño',
      slug: ' nuevo-producto',
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
    try {
        const [productRow] = await db.select().from(Product).where(eq(Product.slug, slug));

        if (!productRow) {
            return null;
        }

        const productAny = productRow as typeof productRow & { recipe?: string | null };

        return {
            ...productRow,
            recipe: parseRecipe(productAny.recipe),
        };
    } catch (error) {
        if (!isMissingRecipeColumnError(error)) {
            throw error;
        }

        const [productRow] = await db
            .select(productBaseSelection)
            .from(Product)
            .where(eq(Product.slug, slug));

        if (!productRow) {
            return null;
        }

        return {
            ...productRow,
            recipe: emptyRecipe(),
        };
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
