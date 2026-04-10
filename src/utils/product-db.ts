import { Product } from "astro:db";

export const productBaseSelection = {
  id: Product.id,
  title: Product.title,
  description: Product.description,
  price: Product.price,
  sizes: Product.sizes,
  slug: Product.slug,
  categoryId: Product.categoryId,
};

export function isMissingRecipeColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("no such column: recipe") ||
    message.includes("no column named recipe")
  );
}
